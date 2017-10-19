var https = require('https');
var fileSystem = require('fs');
var onExit = require('signal-exit');
var exitHook = require('exit-hook');
var commonWords = require('common-words');
var adjectives = require('adjectives');

// commonWords is missing a few all too common words
commonWords.push({
    word: "is"
});

// reddit specific words and acronyms
commonWords.push({
    word: "gt"
});
commonWords.push({
    word: "wiki"
});
commonWords.push({
    word: "NightModeCompatible"
});

var batchSize = 2;

var statePath = "state.json";
var state = {
    after: ""
};

function removeWords(input, words) {
    var index;
    for (index in words) {
        var word = words[index];
        if (!!word.word) {
            word = word.word;
        }
        input = input.replace(new RegExp(`( ${word} | ${word}$|^${word} )`, 'gi'), '');
    }
    return input;
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
                genre: subreddit.audience_target,
                total_subscribers: subreddit.subscribers,
            }

            function cleanDescription(description) {
                return description
                    .replace(/(?:https?|ftp):\/\/[\n\S]+/g, ' ') // Remove all URLs
                    .replace(/\\n/g, ' ') // Convert all literal "\n" to spaces
                    .replace(/[^a-zA-Z\/\s]/g, ' ') // Strip all special charactors except /. Keep a-z, A-Z, and whitespace)
                    .replace(/\s+/g, ' '); // Convert all whitespace to just spaces
            }

            function parseMentionedSubreddits(description, currentName) {
                var mentionedSubreddits = [];
                const regex = /r\/\w+/g;
                let m;
                while ((m = regex.exec(description)) !== null) {
                    if (m.index === regex.lastIndex) {
                        regex.lastIndex++;
                    }
                    m.forEach((match, groupIndex) => {
                        if (match !== currentName && mentionedSubreddits.indexOf(match) === -1) {
                            mentionedSubreddits.push(match);
                        }
                    });
                }

                return mentionedSubreddits;
            }

            if (!!subreddit.description) {
                // Remove all URLs
                var strippedDescription = cleanDescription(subreddit.description);

                subredditData.mentionedSubreddits = parseMentionedSubreddits(strippedDescription);
                // Remove any metioned subreddits now that they have been parsed out
                strippedDescription = strippedDescription
                    .replace(/\/r\/\w+/g, '') // Remove anything matching /r/...
                    .replace(/\//g, ' ') // Remove any remaining /
                    .replace(/\s+/g, ' '); // Convert all whitespace to just spaces

                // Strip the top 100 most used English words
                strippedDescription = removeWords(strippedDescription, commonWords);
                // Strip as many adjectives as possible (sample size of 1000)
                strippedDescription = removeWords(strippedDescription, adjectives);
                subredditData.description = strippedDescription;
            }

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
    console.log("Exit hook caught");
    fileSystem.writeFileSync(statePath, JSON.stringify(state));
    console.log("Crawler terminated, current state saved as " + state.after);
});

module.exports = {
    crawl: function() {
        loadStateJSON(function(after) {
            console.log("Resuming search from last saved state: " + state.after);
            continueSearch(after)
        });
    }
};

require('make-runnable');
