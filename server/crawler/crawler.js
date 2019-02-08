'use strict'
require('dotenv').config()
const fs = require("fs")
const https = require('follow-redirects').https;
const exitHook = require('exit-hook');
const chalk = require('chalk');
const regex = require('./regexModule');
const descriptionParser = require('./descriptionParser');
const languageFilter = require('./languageFilter');
const models = require('../db/models');
const reddit = require('../redditAPI').CrawlerAPI;
const Subreddit = models.Subreddit;
const Tag = models.Tag;
const Relation = models.Relation;
const TagRelation = models.TagRelation
const Hashset = require('hashset');
const Promise = require("bluebird");
const Op = require("sequelize").Op;
const htmlToJSON = require('html-to-json');
//  This is the message that appears as the reponse for any NSFW page
const nsfwMessage = 'You must be at least eighteen years old to view this content. Are you over eighteen and willing to see adult content?';
/*
Things to do:
- global hashmap with keys -> date of last update
- storage of hashmap into db
- convert all of crawler to that construction
- if subreddit in hashmap and last visited a month ago or longer => visit again
*/

var batchSize = 1;

var logging = false;
var recusiveLogging = false;

var testingMode = false;
var triggerExit = false;

var statePath = "state.json";
var state = {
    after: "",
    maxDepthReached: 0,
    maxDepthSubreddit: ""
};
// our trainable wordfilter
var wordFilter = [];

// this hashmap will contain recently viseted subreddits within that cralwer scope
var visitedTable = new Map();

function normalizeURL(url) {
    return url.replace('/r/','').replace('/','');
}

function get_json(url, callback) {
    console.log(`Querying ${url}`);
    https.get(url, function(res) {
        var body = '';
        res.on('data', function(chunk) {
            body += chunk;
        });

        res.on('end', function() {
            // console.log(chalk.magenta(body));
            var response = JSON.parse(body);
            callback(response);
        });
    }).on('error', function(err) {
        console.log(chalk.red(err));
    })
}

// much like get_json, but requires more processing
function getJSONFromSubreddit(url, callback) {

    console.log('Querying ' + subredditURLBuilder(url));
    //  must find a work around until reddit approves the personal use script for acess to their api
    // reddit.getSubreddit(normalizeURL(url)).fetch().then(console.log);

    https.get(subredditURLBuilder(url), function(res) {
        var body = '';
        var over18 = false;
        res.on('data', function(chunk) {
            body += chunk;
        });

        res.on('end', function() {
            //  we could also try to find hrefs to other sights on the page
            htmlToJSON.parse(body, {
                url: url,
                over18: function($doc) {
                    if ($doc.find('.content').find('.interstitial').find('.interstitial-message md-container').find('.md').text() != "") {
                        over18 = true;
                    }
                    return over18;
                },
                content: function($doc) {
                    return $doc.find('#siteTable').find('.title').text();
                },
                description: function($doc) {
                    return $doc.find('.side').find('.md').text();
                },
                subscribers: function($doc) {
                    if (over18) {
                        return 0;
                    } else {
                        return parseInt($doc.find('.subscribers').find('.number').text().replace(',', ''));
                    }
                }
            }, function (err, result) {
                // console.log(result);
                // console.log(chalk.magenta("" + result.description));
                // console.log(chalk.blue("" + result.subscribers));
                // console.log(chalk.yellow(descriptionParser.getMentionedSubreddits(result)));

            }).done(function (result) {
                callback(result);
            });
        });
    }).on('error', function(err) {
        console.log(chalk.red(err));
    })
}

function getSubredditMetaData(url, visitedTable) {
    return new Promise((resolve, reject) => {
        getJSONFromSubreddit(url, function(res) {
            parseRecursiveSingular(res, visitedTable, function() {
                resolve(url);
            });
        })
    })
};

//  The top level entry point into the general crawling of subreddits
function getReddits(after) {
    return new Promise((resolve, reject) => {
        get_json(buildURL(after, batchSize), function(response) {
            parseRecursive(response.data.children, visitedTable, () => {
                resolve(response.data.after);
            })
        });
    });
}

function subredditURLBuilder(url) {
    // our related subreddit parser has a tendence to pick out the subreddit url and the word 'use' together
    // input cleaning
    if (url.substr(url.length - 4) === 'use/' && url.substr(url.length - 6) !== 'house/') {
        console.log(chalk.red('This url has the substring use/ in it: ')  + chalk.green(url));
        url = url.substr(0, url.length - 4) + '/'
    }
    return 'https://www.reddit.com' + url;
}

// subreddit querying url builder
function buildURL(after, batchSize) {
    var url = "https://www.reddit.com/reddits.json";
    if (!!batchSize) {
        url += "?limit=" + batchSize;
    }
    if (!!after) {
        url += "&after=" + after;
    }
    return url;
}

function parseRecursive(subreddits, visitedTable, resolveCallback) {
    addSubredditsToVisted(subreddits, visitedTable);
    // constantly creating new threads for this, need to prevent that
    console.log("Parsing " + subreddits.length + " Subreddits");
    subreddits.forEach(subreddit => {
        console.log("Parsing this subreddit " + subreddit.data.url);
        parseSubreddit(subreddit.data, visitedTable);
    });
    // resolves back to top level when done with this batch of subreddits
    resolveCallback();
}

function parseRecursiveSingular(subreddit, visitedTable, resolveCallback) {
    addSubredditToVisted(subreddit, visitedTable);
    console.log("Parsing this subreddit" + subreddit.url);
    parseSubreddit(subreddit, visitedTable);

    resolveCallback();
}

//  preprocesses the subreddits to visit, adds all subreddits to visited table
function addSubredditsToVisted(subreddits, visitedTable) {
    subreddits.forEach(subreddit => {
        addSubredditToVisted(subreddit.data, visitedTable);
    })
}

function addSubredditToVisted(subredditData, visitedTable) {
    if (subredditData.url) {
        console.log(chalk.blue("Adding " + subredditData.url + " to visited table."))
        subredditData.url = subredditData.url.toLowerCase();
        visitedTable.add(subredditData.url);
    } else {
        console.log(chalk.red("attempted to add a subreddit without data to the list of visited"));
    }
}

function parseSubreddit(subredditData, visitedTable) {
    if (!subredditData) {
        console.log(chalk.red("parseSubreddit called with no data"));
    } else {
        if (!subredditData.subscribers) {
            subredditData.subscribers = 0;
        }
        // for now we should not explore NSFW subreddits as we dont have clean/straightforward access to their pages to scrape info from
        // also subreddits without content or descriptions are not real subreddits
        // also subreddits without content or descriptions coule be private subreddits and should not be parsed or classified
        if (!subredditData.over18 && subredditData.description !== '' && subredditData.content !== '') {

            subredditData.url = subredditData.url.toLowerCase();
            console.log("Found " + subredditData.url);

            return Subreddit.findOne({
                where: {
                    url: {
                        [Op.eq]: subredditData.url
                    }
                }
            }).then(res => {
                if (res) {
                    return res.update({
                        isNSFW: subredditData.over18,
                        numSubscribers: subredditData.subscribers
                    })
                } else {
                    return Subreddit.create({
                        url: subredditData.url,
                        isNSFW: subredditData.over18,
                        numSubscribers: subredditData.subscribers
                    })
                }
            }).then(subreddit => {

                const csvMatcher = /\b[\w\s]+\b/gi;
                if (subredditData.audience_target != undefined) {
                    var tags = regex.getListOfMatches(subredditData.audience_target, csvMatcher);
                    // console.log(chalk.yellow("These are all the tags from normal audience_target parsing: " + tags));
                } else {
                    // need to find a way to parse subredditData.content without extracting words + numbers as keywords
                    // var tags = regex.getListOfMatches(subredditData.description + '\n' + subredditData.content, csvMatcher);
                    //  subredditData.content is also good, but tends to pull many tags
                    var tags = languageFilter.getWordsFromSample(subredditData.description);
                }

                wordFilter = languageFilter.teachFilter(tags, wordFilter);
                if (subredditData.description !== undefined && subredditData.description !== '') {
                    var tags = languageFilter.filterWords(tags,
                                                      languageFilter.generateFilterList(wordFilter, 30)); // 3 is good
                    // console.log(chalk.yellow("These are all the tags in " + subreddit.url + " from languageFilter: " + tags));
                    tags = new Set(tags);
                    console.log("Total compression of parsed tags in " + subreddit.url + " : " + chalk.green(tags.size) + "/" + chalk.green(subredditData.description.split(' ').length)+ " = " + chalk.blue(tags.size/subredditData.description.split(' ').length * 100) + '%');
                }

                tags.forEach(tag => {
                    if (tag.substr(tag.length - 3) === 'use') {
                        tag = tag.substr(0, tag.length - 3)
                    }
                    return Tag.findCreateFind({
                        where: {
                            // The tag name is also unique
                            name: {
                                [Op.eq]: tag
                            }
                        },
                        defaults: {
                            name: tag
                        }
                    }).then(tag => {

                        TagRelation.findCreateFind({
                            where: {
                                distance:  {
                                    [Op.lte]: 0 // placeholder distance, will look more like where distance: less than value found possibly from depth
                                },
                                subredditId: {
                                    [Op.eq]: subreddit.id
                                },
                                tagId: {
                                    [Op.eq]: tag[0].id
                                }
                            },
                            defaults: {
                                distance: 0, // would default to actual value of distance
                                subredditId: subreddit.id,
                                tagId: tag[0].id
                            }
                        })
                    }).catch(err => {
                        console.log(chalk.red("Fatal Error in parseSubreddit:\n") + chalk.yellow(err));
                        saveStateSync();
                        process.exit(1);
                    })
                })


                // Now for the related subreddits
                var relatedSubreddits = descriptionParser.getMentionedSubreddits(subredditData);
                if (relatedSubreddits.length > 0) {

                    relatedSubreddits.forEach(related => {

                        if (related.substr(related.length - 4) === 'use/' && related.substr(related.length - 6) !== 'house/') {
                            // console.log('This tag has the substring use in it: ' + chalk.yellow(tags[i]))
                            related = related.substr(0, related.length - 4)
                        }

                        return Subreddit.findCreateFind({
                            where: {
                                //  a subreddit's url is a unique identifier, therefore we can assume
                                url: {
                                    [Op.eq]: related
                                }
                            },
                            defaults: {
                                url: related
                            }
                        }).then(relatedSubreddit => {
                            return Relation.findCreateFind({
                                where: {
                                    relatedSubredditId: {
                                        [Op.eq]: relatedSubreddit[0].id
                                    },
                                    subredditId: {
                                        [Op.eq]: subreddit.id
                                    }
                                },
                                defaults: {
                                    distance: 0,
                                    subredditId: subreddit.id,
                                    relatedSubredditId: relatedSubreddit[0].id
                                }
                            })
                        }).then(relation => {
                            // add the subreddits related to that related subreddit as relations
                            // to the head subreddit
                            return Relation.findAll({
                                where: {
                                    subredditId: {
                                        [Op.eq]: relation.relatedSubredditId
                                    },
                                    relatedSubredditId: {
                                        [Op.ne]: subreddit.id
                                    },
                                    distance: {
                                        [Op.lte]: 3 // 3 is a good max value for distance (from experience last semester) relax this restriction anymore and we get this wierd convergance were the most controversial subreddits (hate subreddits too) are the most connected
                                    }
                                }
                            })
                        }).then(relations => {
                            if (relations) {
                                relations.forEach(r => {
                                    // create a relation for each related subreddit of that related subreddit
                                    // basically propagate relations
                                    console.log(chalk.yellow("this is what the relation looks like " + r))
                                    Relation.findCreateFind({
                                        where: {
                                            subredditId: {
                                                [Op.eq]: subreddit.id
                                            },
                                            relatedSubredditId: {
                                                [Op.eq]: r.relatedSubredditId
                                            },
                                            distance: {
                                                [Op.lte]: r.distance
                                            }
                                        },
                                        defaults: {
                                            distance: r.distance + 1,
                                            subredditId: subreddit.id,
                                            relatedSubredditId: r.relatedSubredditId
                                        }
                                    })
                                })
                            }
                        }).catch(err => {
                            console.log(chalk.red("Fatal Error in parseSubreddit:\n") + chalk.yellow(err));
                            saveStateSync();
                            process.exit(1);
                        })
                    })
                }
            }).then(() => {

                var relatedSubreddits = descriptionParser.getMentionedSubreddits(subredditData);

                if (relatedSubreddits.length > 0) {
                    relatedSubreddits.forEach(reddit => {
                        if(!visitedTable.contains(reddit)) {
                            console.log(chalk.yellow("url: " + subredditURLBuilder(reddit)));
                            getSubredditMetaData(reddit, visitedTable).then(res => {
                                console.log(chalk.green('Finshed: ' + res));
                            }).catch(err => {
                                console.log(chalk.red("Fatal Error in parseSubreddit:\n") + chalk.yellow(err));
                                saveStateSync();
                                process.exit(1);
                            })
                        }
                    })
                }

                console.log(`Finished ${subredditData.url}`);

            }).then(() => {

            }).catch(err => {
                console.log(chalk.red("Fatal Error in parseSubreddit:\n") + chalk.yellow(err));
                saveStateSync();
                process.exit(1);
            })
        } else {
            // do nothing the subreddit data is corrupted/incomplete
        }
    }
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
            }, 10000);
        }
    ).catch((err) => {
        console.log(chalk.red("Error in continueSearch:\n") + chalk.yellow(err));
    });
}

function loadStateJSON(callback) {
    fs.readFile(statePath, (err, data) => {
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

function saveStateSync() {
    if (!testingMode) {
        fs.writeFileSync(statePath, JSON.stringify(state));
        console.log("    Crawler terminated, current state saved as " + state.after);
    }
}

exitHook(function() {
    if (triggerExit) {
        if (logging) {
            console.log("Exit Hook Triggered");
        }
        saveStateSync();
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
        triggerExit = false; // change to true for deployment runtime
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
        return parseRecursive(subredditsData, [], callback);
    }
};

require('make-runnable/custom')({
    printOutputFrame: false
});
