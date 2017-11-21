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
var recusiveLogging = true;

var testingMode = false;
var triggerExit = false;

var statePath = "state.json";
var state = {
    after: "",
    maxDepthReached: 0,
    maxDepthSubreddit: ""
};

function getReddits(after) {
    return new Promise((resolve, reject) => {
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
            parseRecursive(response.data.children, 0, function() {
                resolve(response.data.after);
            });
        });
    });
}

function parseRecursive(subreddits, currIndex, resolveCallback) {
    console.log("Parsing Subreddit " + (currIndex + 1) + "/" + batchSize);
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
    subredditData.url = subredditData.url.toLowerCase();
    console.log("Found " + subredditData.url);
    if (!subredditData) {
        console.log("No data was provided");
    }
    Subreddit.findOneAndUpdate({
        url: subredditData.url
    }, {}, {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true
    }, function(err, subreddit) {
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

            // Put the tag in the overall tags table if it doesnt exist yet.
            Tag.findOneAndUpdate({
                name: tags[i]
            }, {
                name: tags[i]
            }, {
                upsert: true
            }, function(err, newTag) {
                if (!newTag) {
                    console.log("New Tag Discovered");
                }
            });
        }

        subreddit._relatedSubreddits = descriptionParser.getMentionedSubreddits(subredditData);

        updateSubreddit(subreddit, function(updatedSubreddit) {
            for (i = 0; i < subreddit._relatedSubreddits.length; i++) {
                var subredditURL = subreddit._relatedSubreddits[i];
                console.log("Updating (" + (i + 1) + "/" + subreddit._relatedSubreddits.length + "): " + subredditURL);
                propagateSubredditData(subredditURL, updatedSubreddit, 1, [updatedSubreddit.url]);
            }

            console.log(`Finished ${subredditData.url}`);

            process.nextTick(callback);
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
    var loggingIndent = "";
    if (logging || recusiveLogging) {
        var count;
        for (count = 0; count < depth; count++) {
            loggingIndent += "  ";
        }
    }

    // Statistical analysis
    if (state.maxDepthReached < depth) {
        state.maxDepthReached = depth;
        state.maxDepthSubreddit = subredditURL;
    }

    // Handle self referential loops
    if (searched.indexOf(subredditURL) !== -1) {
        if (logging) {
            console.log(loggingIndent + "Already Searched: " + subredditURL);
        }
        return;
    }

    Subreddit.findOneAndUpdate({
        url: subredditURL
    }, {}, {
        new: true,
        upsert: true
    }, function(err, subreddit) {
        if (subreddit._relatedSubreddits.indexOf(parentSubreddit.url) === -1) {
            subreddit._relatedSubreddits.push(parentSubreddit.url);
        }
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
            updateSubreddit(subreddit, function(updatedSubreddit) {
                if (!!updatedSubreddit._relatedSubreddits) {
                    var relatedIndex;
                    for (relatedIndex = 0; relatedIndex < updatedSubreddit._relatedSubreddits.length; relatedIndex++) {
                        // we want to update any possible tags that weren't originally referenced.
                        var nextURL = updatedSubreddit._relatedSubreddits[relatedIndex];
                        var searchedIndex = searched.indexOf(nextURL);
                        if (searchedIndex > -1) {
                            searched.splice(searchedIndex, 1);
                            if (logging) {
                                console.log(loggingIndent + "Need to scan " + nextURL + " again in case changes relate.");
                            }
                        }
                        if (logging || recusiveLogging) {
                            console.log(
                                loggingIndent + "Updating (" + (relatedIndex + 1) + "/" + updatedSubreddit._relatedSubreddits.length +
                                "): " + updatedSubreddit.url + " => " + nextURL
                            );
                        }
                        propagateSubredditData(nextURL, updatedSubreddit, depth + 1, searched);
                    }
                }
            });
        } else {
            if (logging) {
                console.log(loggingIndent + "Finished: " + subredditURL);
            }
            searched.push(subredditURL);
        }
    });
}

// Tags are {name:"tagName", distance:X}
function updateTag(subreddit, newTag, depth) {
    var i;
    for (i in subreddit.tags) {
        if (subreddit.tags[i].name === newTag.name) {
            if (subreddit.tags[i].distance > (newTag.distance + depth)) {
                //console.log("Tag had better distance: " + newTag + "[" + subreddit.tags[i].distance + " => " + (newTag.distance + depth) + "]");
                subreddit.tags[i].distance = (newTag.distance + depth);
                return true;
            }
            //console.log("Tag had worse distance: " + newTag + "[" + subreddit.tags[i].distance + " < " + (newTag.distance + depth) + "]");
            return false;
        }
    }
    //console.log("Tag not found: " + newTag);
    subreddit.tags.push({
        name: newTag.name,
        distance: newTag.distance + depth
    });
    return true;
}

function continueSearch(after) {
    getReddits(after).then(
        function(after) {
            if (logging) {
                console.log("Resolved: " + after);
            }
            state.after = after;
            setTimeout(function() {
                continueSearch(after);
            }, 1000);
        }
    ).catch((err) => {
        console.log(err)
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
        const startDb = require('../db');
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
        return "Crawler Initialized";
    },
    _buildURL: function(after) {
        testingMode = true;
        logging = true;
        return buildURL(after);
    },
    _parseSubreddit: function(subreddit, callback) {
        testingMode = true;
        logging = true;
        return parseSubreddit(subreddit, callback);
    },
    _parseRecursive: function(subredditsData, callback) {
        testingMode = true;
        logging = true;
        return parseRecursive(subredditsData, 0, callback);
    },
    _updateSubreddit: function(subredditData, callback) {
        testingMode = true;
        logging = true;
        return updateSubreddit(subredditData, callback);
    },
    _propagateSubredditData: function(subredditURL, parentSubreddit, depth, searched) {
        testingMode = true;
        logging = true;
        return propagateSubredditData(subredditURL, parentSubreddit, depth, searched);
    },
    _updateTag: function(subredditData, newTag, depth) {
        testingMode = true;
        logging = true;
        return updateTag(subredditData, newTag, depth);
    }
};

require('make-runnable/custom')({
    printOutputFrame: false
});
