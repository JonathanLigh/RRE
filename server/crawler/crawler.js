var https = require('https');
var fs = require('fs');

var batchSize = 10;
var state;

function getReddits(after) {
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
            var subredditData = {
                url: subreddit.url,
                genre: subreddit.audience_target,
                total_subscribers: subreddit.subscribers,

            }

            // put parsed stuff in db
            console.log(subredditData.url);

            return subredditData;
        }

        get_json(buildURL(after, batchSize), function(response) {
            var parsedData = {
                parsedSubredditData: []
            };

            var subreddit;
            for (subreddit in response.data.children) {
                parsedData.parsedSubredditData.push(
                    parseSubreddit(
                        response.data.children[subreddit].data
                    )
                );
            }
            parsedData.after = response.data.after;
            resolve(parsedData);
        });
    });
}

function continueSearch(after) {
    getReddits(after).then(
        function(parsedData) {
            setTimeout(function() {
                continueSearch(parsedData.after)
            }, 1000);
        },
        function(error) {
            console.log(error);
        });
}

module.exports = {
    crawl: function() {
        fs.readFile('state.json', (err, data) => {
            if (err) {
                throw err;
            }
            state = JSON.parse(data);
            continueSearch();
        });
    }
};

require('make-runnable');
