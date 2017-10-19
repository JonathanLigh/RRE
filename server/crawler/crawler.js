var https = require('https');
var fileSystem = require('fs');
var onExit = require('signal-exit');
var exitHook = require('exit-hook');

var batchSize = 100;

var statePath = "state.json";
var state = {
    after: ""
};

function getReddits(after) {
    console.log("CURRENT STATE: " + state.after);
    return new Promise(function(resolve, reject) {
        function get_json(url, callback) {
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
            console.log(url);
            return url;
        }

        function parseSubreddit(subreddit) {
            console.log("Scanning " + subreddit.url);

            var subredditData = {
                name: subreddit.name,
                url: subreddit.url,
                genre: subreddit.audience_target,
                total_subscribers: subreddit.subscribers,
                description: subreddit.description
            }

            var subredditPath = `./parsed_subreddits/${subreddit.name}.json`;
            fileSystem.writeFileSync(subredditPath, JSON.stringify(subredditData));
            state.after = after;
            console.log("Finished " + subreddit.url);
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
