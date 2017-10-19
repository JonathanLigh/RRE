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

            var subredditData = {
                name: subreddit.name,
                url: subreddit.url,
                total_subscribers: subreddit.subscribers,
            }

            const csvMatcher = /\b[\w\s]+\b/gi;
            subredditData.audienceTarget = regex.getListOfMatches(subreddit.audience_target, csvMatcher);

            subredditData.mentionedSubreddits = descriptionParser.getMentionedSubreddits(subreddit);

            var subredditPath = `./parsed_subreddits/${subreddit.name}.json`;
            fileSystem.writeFileSync(subredditPath, JSON.stringify(subredditData));
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
    genres: function() {
        var genres = [];
        var parsedSubreddits = fileSystem.readdirSync("./parsed_subreddits/");
        var index;
        for (index in parsedSubreddits) {
            var subreddit = JSON.parse(fileSystem.readFileSync("./parsed_subreddits/" + parsedSubreddits[index]));
            var i;
            for (i in subreddit.audienceTarget) {
                var genre = subreddit.audienceTarget[i];
                if (genres.indexOf(genre) === -1) {
                    genres.push(genre);
                }
            }
        }
        console.log("Total: " + genres.length);
        console.log(genres);
    },
    getSubredditForGenre: function(genre) {
        var parsedSubreddits = fileSystem.readdirSync("./parsed_subreddits/");
        var index;
        for (index in parsedSubreddits) {
            var subreddit = JSON.parse(fileSystem.readFileSync("./parsed_subreddits/" + parsedSubreddits[index]));
            if (subreddit.audienceTarget.indexOf(genre) !== -1) {
                console.log(subreddit.url);
            }
        }
    }
};

require('make-runnable');
