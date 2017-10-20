var https = require('https');
var fileSystem = require('fs');
var exitHook = require('exit-hook');
const regex = require('./regexModule');
const descriptionParser = require('./descriptionParser');

var batchSize = 10;

var statePath = "state.json";
var state = {
    after: ""
};

var updateOnExit = false;

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

        function parseSubreddit(subreddit) {
            console.log(`Scanning ${subreddit.url}`);

            var subredditData;
            var fileName = regex.getNameFromURL(subreddit.url)
            if (fileSystem.existsSync(`./parsed_subreddits/${fileName}.json`)) {
                subredditData = JSON.parse(fileSystem.readFileSync(`./parsed_subreddits/${fileName}.json`));
            } else {
                subredditData = {
                    tags: []
                }
            }

            subredditData.url = subreddit.url;
            subredditData.name = subreddit.name;
            subredditData.total_subscribers = subreddit.subscribers;

            const csvMatcher = /\b[\w\s]+\b/gi;
            var tags = regex.getListOfMatches(subreddit.audience_target, csvMatcher);
            var i;
            for (i in tags) {
                updateTags(subredditData, {
                    tag: tags[i]
                }, 0);
            }

            subredditData.relatedSubreddits = descriptionParser.getMentionedSubreddits(subreddit);

            writeSubreddit(fileName, subredditData);

            for (i in subredditData.relatedSubreddits) {
                //console.log("spreading tags to " + subredditData.relatedSubreddits[i]);
                propagateSubredditData(subredditData.relatedSubreddits[i], subredditData, 1, []);
            }

            console.log(`Finished ${subreddit.url}`);
        }

        get_json(buildURL(after, batchSize), function(response) {
            var subreddit;
            for (subreddit in response.data.children) {
                parseSubreddit(response.data.children[subreddit].data);
            }

            resolve(response.data.after);
        });
    });
}

function writeSubreddit(fileName, subredditData) {
    //console.log("writing " + fileName + " to file system");
    var subredditPath = `./parsed_subreddits/${fileName}.json`;
    fileSystem.writeFileSync(subredditPath, JSON.stringify(subredditData));
}

function propagateSubredditData(subredditURL, parentSubredditData, depth, searched) {
    // This is really inefficient but that is because the db isnt ready yet

    var fileName = regex.getNameFromURL(subredditURL);
    // handle self reference
    //console.log("Searching for " + depth);
    if (searched.indexOf(fileName) !== -1) {
        console.log("it caught " + fileName);
        return;
    }

    var subredditData;
    if (fileSystem.existsSync(`./parsed_subreddits/${fileName}.json`)) {
        subredditData = JSON.parse(fileSystem.readFileSync(`./parsed_subreddits/${fileName}.json`));
        //console.log("Found " + subredditData.url + " in file system");
    } else {
        subredditData = {
            url: subredditURL,
            tags: [],
            relatedSubreddits: [parentSubredditData.url.replace(/^\/|\/$/g, '')]
        };
        //console.log("Going to create " + subredditURL + " in file system");
    }
    var updatedTags = false;
    var i;
    for (i in parentSubredditData.tags) {
        updatedTags = updatedTags || updateTags(subredditData, parentSubredditData.tags[i], depth);
    }
    if (updatedTags) {
        writeSubreddit(regex.getNameFromURL(subredditURL), subredditData);
        if (!!subredditData.relatedSubreddits) {
            console.log("spreading tags recursively");
            for (i in subredditData.relatedSubreddits) {
                // we want to update any possible tags that weren't originally referenced.
                var nextFileName = regex.getNameFromURL(subredditData.relatedSubreddits[i]);
                if (searched.indexOf(nextFileName) > -1) {
                    searched.splice(index, 1);
                }
                propagateSubredditData(subredditData.relatedSubreddits[i], subredditData.tags, depth + 1, searched);
            }
        }
    } else {
        searched.push(fileName);
    }
}

// Tags are {tag:"tagName", mentionDistance:X}
function updateTags(subredditData, newTag, mentionDistance) {
    var i;
    for (i in subredditData.tags) {
        var existingTag = subredditData.tags[i];
        if (existingTag.tag === newTag.tag) {
            if (existingTag.mentionDistance > mentionDistance) {
                //console.log("updating closer mention: " + newTag.tag + ": " + mentionDistance);
                existingTag.mentionDistance = mentionDistance;
                return true;
            }
            return false;
        }
    }
    //console.log("tag was not found, adding: " + newTag.tag + ": " + mentionDistance);
    subredditData.tags.push({
        tag: newTag.tag,
        mentionDistance: mentionDistance
    });
    return true;
}

function continueSearch(after) {
    getReddits(after).then(
        function(after) {
            state.after = after;
            setTimeout(function() {
                continueSearch(after)
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
                console.log("state initialized to " + state.after);
            }
        }
        callback(state.after);
    });
}

exitHook(function() {
    if (updateOnExit) {
        fileSystem.writeFileSync(statePath, JSON.stringify(state));
        console.log("    Crawler terminated, current state saved as " + state.after);
    }
});

module.exports = {
    crawl: function() {
        loadStateJSON(function(after) {
            updateOnExit = true;
            continueSearch(after)
        });
    },
    getAllTags: function() {
        var tags = [];
        var parsedSubreddits = fileSystem.readdirSync("./parsed_subreddits/");
        var index;
        for (index in parsedSubreddits) {
            var subreddit = JSON.parse(fileSystem.readFileSync("./parsed_subreddits/" + parsedSubreddits[index]));
            var i;
            for (i in subreddit.tags) {
                var tag = subreddit.tags[i];
                if (tags.indexOf(tag) === -1) {
                    tags.push(tag);
                }
            }
        }
        console.log("Total: " + tags.length);
        console.log(tags);
    },
    getSubredditForTag: function(tag) {
        var parsedSubreddits = fileSystem.readdirSync("./parsed_subreddits/");
        var index;
        for (index in parsedSubreddits) {
            var subreddit = JSON.parse(fileSystem.readFileSync("./parsed_subreddits/" + parsedSubreddits[index]));
            if (subreddit.tags.indexOf(tag) !== -1) {
                console.log(subreddit.url);
            }
        }
    }
};

require('make-runnable');
