var https = require('https');
var fileSystem = require('fs');
var onExit = require('signal-exit');
var exitHook = require('exit-hook');
var commonWords = require('common-words');
var adjectives = require('adjectives');
var Heap = require('heap');

var batchSize = 100;

var statePath = "state.json";
var state = {
    after: ""
};

var wordMapPath = "words.json";
var wordMap = {};

var updateOnExit = false;

function initCommonWords() {
    // commonWords is missing a few all too common words
    commonWords.push({
        word: "is"
    }, {
        word: "are"
    });

    // reddit specific words and acronyms
    commonWords.push({
        word: "gt"
    }, {
        word: "amp"
    }, {
        word: "nbsp"
    }, {
        word: "wiki"
    }, {
        word: "config"
    }, {
        word: "NightModeCompatible"
    }, {
        word: "s"
    }, {
        word: "r"
    }, {
        word: "sr"
    }, {
        word: "lt"
    }, {
        word: "links"
    }, {
        word: "flair"
    }, {
        word: "post"
    }, {
        word: "posts"
    }, {
        word: "moderators"
    }, {
        word: "mods"
    }, {
        word: "rules"
    }, {
        word: "ban"
    }, {
        word: "subreddits"
    }, {
        word: "subreddit"
    }, {
        word: "t"
    }, {
        word: "more"
    }, {
        word: "please"
    }, {
        word: "here"
    }, {
        word: "links"
    }, {
        word: "reddit"
    }, {
        word: "related"
    }, {
        word: "comments"
    });

    /*
    rules: 44
    s: 38
    post: 35
    posts: 34
    subreddits: 32
    t: 32
    more: 32
    please: 30
    here: 30
    links: 29
    reddit: 29
    related: 29
    subreddit: 28
    comments: 28
    content: 28
    removed: 27
    information: 26
    must: 25
    personal: 24
    moderators: 24
    posting: 23
    rule: 22
    click: 21
    message: 21
    discussion: 20
    don: 20
    twitter: 20
    should: 20
    ban: 20
    text: 20
    result: 20
    r: 19
    questions: 18
    read: 18
    memes: 18
    may: 18
    check: 18
    team: 18
    news: 18
    link: 17
    community: 17
    image: 17
    before: 17
    titles: 17
    submissions: 17
    report: 17
    info: 16
    sr: 16
    facebook: 16
    submit: 16

    Racist ethnic sexist homophobic slurs
    */

    console.log("Common words updated");
}

function removeWords(input, words) {
    var index;
    for (index in words) {
        var word = words[index];
        if (!!word.word) {
            word = word.word;
        }
        input = input.replace(new RegExp("\\b" + word + "\\b", 'gi'), ' ');
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
            function cleanDescription(description) {
                return description
                    .replace(/(?:https?|ftp):\/\/[\n\S]+/g, ' ') // Remove all URLs
                    .replace(/\\n/g, ' ') // Convert all literal "\n" to spaces
                    .replace(/[^a-zA-Z\/\s]/g, ' ') // Strip all special charactors except /. Keep a-z, A-Z, and whitespace)
                    .replace(/\s+/g, ' '); // Convert all whitespace to just spaces
            }

            /*
             * ALL MATCHES ARE CONVERTED TO LOWER CASE
             */
            function getListOfMatches(searchText, regex, exclude) {
                var matches = [];
                let m;
                while ((m = regex.exec(searchText)) !== null) {
                    if (m.index === regex.lastIndex) {
                        regex.lastIndex++;
                    }
                    m.forEach((match, groupIndex) => {
                        match = match.toLowerCase();
                        if (match !== exclude && matches.indexOf(match) === -1) {
                            matches.push(match);
                        }
                    });
                }

                return matches;
            }

            function addWord(word) {
                if (!!wordMap[word]) {
                    wordMap[word].occurences += 1;
                } else {
                    wordMap[word] = {
                        occurences: 1
                    }
                }
            }

            console.log(`Scanning ${subreddit.url}`);

            var subredditData = {
                name: subreddit.name,
                url: subreddit.url,
                total_subscribers: subreddit.subscribers,
            }

            const csvMatcher = /\b[\w\s]+\b/gi;
            subredditData.audienceTarget = getListOfMatches(subreddit.audience_target, csvMatcher);

            if (!!subreddit.description) {
                var strippedDescription = cleanDescription(subreddit.description);

                const subredditRegex = /r\/\w+/g; // matches "r/..."
                subredditData.mentionedSubreddits = getListOfMatches(strippedDescription, subredditRegex, subreddit.url);
                // Remove any metioned subreddits now that they have been parsed out
                strippedDescription = strippedDescription
                    .replace(/\/r\/\w+/g, '') // Remove anything matching "/r/..."
                    .replace(/\//g, ' ') // Remove any remaining /
                    .replace(/\s+/g, ' '); // Convert all whitespace to just spaces

                // Strip the top 100 most used English words
                strippedDescription = removeWords(strippedDescription, commonWords);
                // Strip as many adjectives as possible (sample size of 1000)
                strippedDescription = removeWords(strippedDescription, adjectives);
                // Convert all whitespace to just spaces one last time;
                subredditData.description = strippedDescription.replace(/\s+/g, ' ');

                // Populate word heap
                var words = getListOfMatches(strippedDescription, /[^ ]+/g);
                var index;
                for (index in words) {
                    addWord(words[index]);
                }
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

function loadwordMapJSON(callback) {
    fileSystem.readFile(wordMapPath, (err, data) => {
        if (err) {
            console.log("words.json file not initialized");
        } else {
            if (data.byteLength === 0) {
                console.log("words.json file is empty");
            } else {
                wordMap = JSON.parse(data);
                console.log("word map loaded with " + Object.keys(wordMap).length + " entries");
            }
        }
        callback();
    });
}

exitHook(function() {
    if (updateOnExit) {
        fileSystem.writeFileSync(statePath, JSON.stringify(state));
        fileSystem.writeFileSync(wordMapPath, JSON.stringify(wordMap));
        console.log("    Crawler terminated, current state saved as " + state.after);
    }
});

module.exports = {
    crawl: function() {
        initCommonWords();
        loadwordMapJSON(function() {
            loadStateJSON(function(after) {
                updateOnExit = true;
                continueSearch(after)
            });
        });
    },
    mostCommonWords: function(max) {
        loadwordMapJSON(function() {
            var wordMapAsList = [];
            var word;
            for (word in wordMap) {
                wordMapAsList.push({
                    word: word,
                    occurences: wordMap[word].occurences
                });
            }
            var mostCommonWords = Heap.nlargest(wordMapAsList, max, function(a, b) {
                return a.occurences - b.occurences;
            });
            var word;
            for (word in mostCommonWords) {
                console.log(mostCommonWords[word].word + ": " + mostCommonWords[word].occurences);
            }
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
