const express = require('express');
const router = express.Router();
const models = require('../../db/models');
const async = require('async');
const Subreddit = models.Subreddit;
const chalk = require('chalk');
const Heap = require('heap');
const ProgressBar = require('console-progress');
const routeUtils = require('./utils.js');

router.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

/*
returns all unique tags of provided subreddits that are within the provided distance
  The req body will have:
    a list of subreddits
    maximum tag distance
  The res body will have:
    a map of tags and their distances
*/
router.post('/getTagsForSubreddits', function(req, res, next) {
    if (!!req.body.subreddits && !!req.body.maxDistance) {
        Subreddit.find({
            url: {
                $in: req.body.subreddits
            }
        }, function(err, subreddits) {
            var tags = {};
            var index;
            for (index in subreddits) {
                var currTags = subreddits[index].tags;
                var i;
                for (i in currTags) {
                    var tag = currTags[i];
                    if (!tags[tag.name]) {
                        if (tag.distance <= req.body.maxDistance) {
                            tags[tag.name] = tag.distance;
                        }
                    } else {
                        if (tags[tag.name].distance > tag.distance) {
                            tags[tag.name] = tag.distance;
                        }
                    }
                }
            }
            res.status(200);
            res.json(tags);
        }).catch(next);
    } else {
        res.status(422).send('Unprocessable Entity')
    }
});

/*
returns the top (n) recommended subreddits
  The req body will have:
    number of recommendations to return (n)
    a list of tags
    a list of subscribed subreddits
    a list of blacklisted subreddits (unwanted)
  The res body will have:
    a list of the top (n) recommended, in order of relevancy
*/
router.post('/recommended', function(req, res, next) {
    console.log("Searching For " + JSON.stringify(req.body));

    var heap = new Heap(function(subreddit1, subreddit2) {
        // Inverse the score so that elements in the heap with the "highest score" are the worst match.

        var subreddit1Tags = !subreddit1.tags ? [] : routeUtils.getMatchingTags(subreddit1.tags, req.body.tags);
        var subreddit2Tags = !subreddit2.tags ? [] : routeUtils.getMatchingTags(subreddit2.tags, req.body.tags);

        var integralScore = -1 * routeUtils.calculateIntegralScore(subreddit1Tags, subreddit2Tags);
        if (integralScore !== 0) {
            //console.log("Result: " + tagDifference);
            return integralScore;
        }

        // Popularity Difference
        return subreddit1.total_subscribers - subreddit2.total_subscribers;
    });

    if (!!req.body.tags && !!req.body.subscribed && !!req.body.blacklisted && !!req.body.maxRecommendations) {
        var blacklist = req.body.subscribed.concat(req.body.blacklisted);

        Subreddit.find({
            url: {
                $nin: blacklist
            }
        }, function(err, parsedSubreddits) {
            var progressBarScale = 100;
            var bar = ProgressBar.getNew('[:bar] :eta Seconds Remaining', {
                complete: '=',
                incomplete: ' ',
                width: 40,
                total: parsedSubreddits.length / progressBarScale
            });

            for (index in parsedSubreddits) {
                // heap will never exceed maxRecommendations size for maximum efficiency of algorithm
                if (heap.size() >= req.body.maxRecommendations) {
                    heap.pushpop(parsedSubreddits[index]);
                } else {
                    heap.push(parsedSubreddits[index]);
                }
                if (index % progressBarScale === 0) {
                    bar.tick();
                }
            }
            var output = [];
            for (index = 0; index < req.body.maxRecommendations; index++) {
                if (heap.empty()) {
                    break;
                }
                var subreddit = heap.pop();
                output.push({
                    subreddit: subreddit.url,
                    rank: req.body.maxRecommendations - index
                });
            }
            // Reverse the output so that the best recommendations come first.
            output.reverse();

            res.status(200);
            res.json(output);
        }).catch(next);
    } else {
        res.status(422).send('Unprocessable Entity')
    }
});

module.exports = router;
