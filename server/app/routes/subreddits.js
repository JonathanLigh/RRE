const express = require('express');
const router = express.Router();
const models = require('../../db/models');
const async = require('async');
const Subreddit = models.Subreddit;
const chalk = require('chalk');
const Heap = require('heap');
const ProgressBar = require('console-progress');
const routeUtils = require('./utils.js');

/*
returns all unique tags of provided subreddits that are within the provided distance
  The req body will have:
    a list of subreddits
    maximum tag distance
  The res body will have:
    a map of tags and their distances
*/
router.post('/getTagsForSubreddits', function(req, res, next) {
    console.log("Searching For " + JSON.stringify(req.body));
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
        // Could we make this more efficient by storing data? Currently runs decently fast anyway...

        var subreddit1Tags = !subreddit1.tags ? [] : routeUtils.getMatchingTags(subreddit1.tags, req.body.tags);
        var subreddit2Tags = !subreddit2.tags ? [] : routeUtils.getMatchingTags(subreddit2.tags, req.body.tags);

        var tagDifference = subreddit2Tags.length - subreddit1Tags.length;
        if (tagDifference !== 0) {
            //console.log("Result: " + tagDifference);
            return tagDifference;
        }

        var tagSumDifference = routeUtils.getMentionDistanceSum(subreddit1Tags) - routeUtils.getMentionDistanceSum(subreddit2Tags);
        if (tagSumDifference !== 0) {
            //console.log("Result: " + tagSumDifference);
            return tagSumDifference;
        }

        var tagMinDifference = routeUtils.getMinMentionDistance(subreddit1Tags) - routeUtils.getMinMentionDistance(subreddit2Tags);
        if (tagMinDifference !== 0) {
            //console.log("Result: " + tagMinDifference);
            return tagMinDifference;
        }

        // Popularity Difference
        return subreddit2.total_subscribers - subreddit1.total_subscribers;
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
                heap.push(parsedSubreddits[index]);
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
                var subredditTagsMatched = routeUtils.getMatchingTags(subreddit.tags, req.body.tags);
                output.push({
                    subreddit: subreddit.url,
                    rank: index,
                    tagsMatched: subredditTagsMatched.length,
                    tagScore: routeUtils.getMentionDistanceSum(subredditTagsMatched),
                    depth: routeUtils.getMinMentionDistance(subredditTagsMatched)
                });
            }
            res.status(200);
            res.json(output);
        }).catch(next);
    } else {
        res.status(422).send('Unprocessable Entity')
    }
});

module.exports = router;
