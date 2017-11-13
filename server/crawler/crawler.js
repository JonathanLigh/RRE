const https = require('https');
const fileSystem = require('fs');
const exitHook = require('exit-hook');
const regex = require('./regexModule');
const descriptionParser = require('./descriptionParser');
const models = require('../db/models');
const Subreddit = models.Subreddit;
const Tag = models.Tag;

var batchSize = 1;

var logging = false;

var testingMode = false;
var triggerExit = false;

if (!testingMode) {
    const startDb = require('../db');
}

var statePath = "state.json";
var state = {
    after: "",
    maxDepthReached: 0,
    maxDepthSubreddit: ""
};

function getReddits(after) {
    return new Promise(function(resolve, reject) {
        function get_json(url, callback) {
            console.log(`Querying ${url}`);
            https.get(url, function(res) {
                var body = '';
                res.on('data', function(chunk) {
                    body += chunk;
                });

                res.on('end', function() {
                    var response = JSON.parse(body);
                    callback(response);
                });

                res.on('error', function(error) {
                    reject(error);
                });
            });
        }

        get_json(buildURL(after, batchSize), function(response) {
            response.data.children
            parseRecursive(response.data.children, 0, function() {
                resolve(response.data.after);
            });
        });
    });
}

function parseRecursive(subreddits, currIndex, resolveCallback) {
    parseSubreddit(subreddits[currIndex].data, function() {
        currIndex++;
        if (currIndex >= subreddits.length) {
            resolveCallback();
        } else {
            parseRecursive(subreddits, currIndex, resolveCallback);
        }
    });
}

function buildURL(after) {
    var url = "https://www.reddit.com/reddits.json";
    if (!!batchSize) {
        url += "?limit=" + batchSize;
    }
    if (!!after) {
        url += "&after=" + after;
    }
    return url;
}

function parseSubreddit(subredditData, callback) {
    console.log("Starting " + subredditData.url);
    if (!subredditData) {
        console.log("No data was provided");
    }
    Subreddit.findOneAndUpdate({
        url: subredditData.url
    }, {
        tags: [],
        _relatedSubreddits: []
    }, {
        new: true,
        upsert: true
    }, function(err, subreddit) {
        // console.log("we made one? " + subredditData.url);
        if (!!err) {
            console.log("error in parseSubreddit: " + err);
        }
        subreddit.numSubscribers = subredditData.subscribers;

        const csvMatcher = /\b[\w\s]+\b/gi;
        var tags = regex.getListOfMatches(subredditData.audience_target, csvMatcher);
        var i;
        for (i in tags) {
            updateTag(subreddit, {
                name: tags[i],
                distance: 0
            }, 0);
        }

        subreddit._relatedSubreddits = descriptionParser.getMentionedSubreddits(subredditData);

        updateSubreddit(subreddit, function() {
            for (i = 0; i < subreddit._relatedSubreddits.length; i++) {
                var subredditURL = subreddit._relatedSubreddits[i];
                console.log("Updating (" + (i + 1) + "/" + subreddit._relatedSubreddits.length + "): " + subredditURL);
                propagateSubredditData(subredditURL, subreddit, 1, []);
            }

            console.log(`Finished ${subredditData.url}`);

            callback();
        });
    });
}

function updateSubreddit(subreddit, callback) {
    updateData = {};
    if (!!subreddit.numSubscribers) {
        updateData.numSubscribers = subreddit.numSubscribers;
    }
    if (!!subreddit._relatedSubreddits) {
        updateData._relatedSubreddits = subreddit._relatedSubreddits;
    }
    if (!!subreddit.tags) {
        updateData.tags = subreddit.tags;
    }

    Subreddit.findOneAndUpdate({
        url: subreddit.url
    }, updateData, {
        new: true
    }, function(err, updatedSubreddit) {
        if (!!err) {
            console.log(err);
        }
        callback(updatedSubreddit);
    });
}

function propagateSubredditData(subredditURL, parentSubreddit, depth, searched) {
    // subredditURL is expected to be in the form of '/r/name'

    // Statistical analysis
    if (state.maxDepthReached < depth) {
        state.maxDepthReached = depth;
        state.maxDepthSubreddit = subredditURL;
    }

    // Handle self referential loops
    if (searched.indexOf(subredditURL) !== -1) {
        return;
    }

    Subreddit.findOneAndUpdate({
        url: subredditURL
    }, {
        tags: [],
        _relatedSubreddits: [parentSubreddit.url]
    }, {
        new: true,
        upsert: true
    }, function(err, subreddit) {
        if (!!err) {
            console.log("error in propagate: " + err);
        }
        // subreddit was either found or created, we want to update tags regardless next.
        var updatedTags = false;
        var i;
        for (i in parentSubreddit.tags) {
            updatedTags = updatedTags || updateTag(subreddit, parentSubreddit.tags[i], depth);
        }
        if (updatedTags) {
            // If the tags were modified we should update the subreddit
            updateSubreddit(subreddit, function(subreddit) {
                if (!!subreddit._relatedSubreddits) {
                    for (i in subredditData.relatedSubreddits) {
                        // we want to update any possible tags that weren't originally referenced.
                        var nextURL = subreddit._relatedSubreddits[i];
                        var index = searched.indexOf(nextURL);
                        if (index > -1) {
                            searched.splice(index, 1);
                            if (logging) {
                                console.log("Need to scan " + nextURL + " again in case changes relate.");
                            }
                        }
                        if (logging) {
                            console.log(
                                "Updating (" + i + "/" + subreddit._relatedSubreddits.length + "): " + nextURL
                            );
                        }
                        propagateSubredditData(nextURL, subreddit, depth + 1, searched);
                    }
                }
            });
        } else {
            if (logging) {
                console.log("Finished: " + subredditURL);
            }
            searched.push(subredditURL);
        }
    });
}

// Tags are {name:"tagName", distance:X}
function updateTag(subredditData, newTag, depth) {
    var i;
    for (i in subredditData.tags) {
        var existingTag = subredditData.tags[i];
        if (existingTag.name === newTag.name) {
            if (existingTag.distance > (newTag.distance + depth)) {
                existingTag.distance = (newTag.distance + depth);
                return true;
            }
            return false;
        }
    }
    subredditData.tags.push({
        name: newTag.name,
        distance: newTag.distance + depth
    });
    return true;
}

function continueSearch(after) {
    getReddits(after).then(
        function(after) {
            console.log("Resolve: " + after);
            state.after = after;
            setTimeout(function() {
                continueSearch(after);
            }, 1000);
        },
        function(error) {
            console.log(error);
            process.exit(1);
        });
}

function loadStateJSON(callback) {
    fileSystem.readFile(statePath, (err, data) => {
        if (err) {
            console.log("state.json file not initialized");
        } else {
            if (data.byteLength === 0) {
                console.log("state.json file is empty");
            } else {
                state = JSON.parse(data);
            }
        }
        callback(state.after);
    });
}

exitHook(function() {
    if (triggerExit) {
        if (logging) {
            console.log("Exit Hook Triggered");
        }
        if (!testingMode) {
            fileSystem.writeFileSync(statePath, JSON.stringify(state));
            console.log("    Crawler terminated, current state saved as " + state.after);
        }
        process.exit(0);
    }
});

module.exports = {
    crawl: function(size) {
        if (size > 100) {
            console.log("Max batch size is 100");
            size = 100;
        } else if (size < 0) {
            console.log("Min batch size is 1");
            size = 1;
        }
        batchSize = size;
        triggerExit = true;
        loadStateJSON(function(after) {
            console.log("Starting search from " + state.after);
            continueSearch(after);
        });
    },
    _buildURL: function(after) {
        testingMode = true;
        return buildURL(after);
    },
    _parseSubreddit: function(subreddit) {
        testingMode = true;
        return parseSubreddit(subreddit);
    },
    _updateSubreddit: function(subredditData, callback) {
        testingMode = true;
        return updateSubreddit(subredditData, callback);
    },
    _propagateSubredditData: function(subredditURL, parentSubreddit, depth, searched) {
        testingMode = true;
        return propagateSubredditData(subredditURL, parentSubreddit, depth, searched);
    },
    _updateTag: function(subredditData, newTag, depth) {
        testingMode = true;
        return updateTag(subredditData, newTag, depth);
    }
};

/*
updateDescription: function(size) {
    if (size > 100) {
        console.log("Max batch size is 100");
        size = 100;
    } else if (size < 0) {
        console.log("Min batch size is 1");
        size = 1;
    }
    batchSize = size;
    loadStateJSON(function(after) {
        console.log("Starting search from " + state.after);
        continueSearch(after);
    });
}*/

require('make-runnable/custom')({
    printOutputFrame: false
});
