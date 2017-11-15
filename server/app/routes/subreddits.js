const express = require('express');
const router = express.Router();
const models = require('../../db/models');
const async = require('async');
const Subreddit = models.Subreddit;
const chalk = require('chalk');
const Heap = require('heap');

/*
returns the top 5 recommended subreddits
  The req body will have:
    a list of subscribed subreddits
    a list of blacklisted subreddits (unwanted)
  The res body will have:
    a list of the top 5 recommended
*/

router.get('/getTagsForSubreddit', function(req, res, next) {
    Subreddit.find().getTagsBySubreddits(req.body.subreddits).exec(function(err, res) {
        return res
    }).then(tags => {
        console.log(chalk.green("tags after getting them from every Subreddit passed in: " + tags));

        tags = tags.map(element => element.tags).reduce((a, b) => a.concat(b), []);
        return tags
    }).then(list => {
        res.status(200);
        res.json(list);
    }).catch(next);
});

router.get('/recommended', function(req, res, next) {
    function getMatchingTags(tags) {
        var matchingTags = [];
        var i;
        for (i in tags) {
            var tag = tags[i];
            if (searchTags.indexOf(tag.tag) !== -1) {
                matchingTags.push(tag);
            }
            if (matchingTags.length === searchTags.length) {
                return matchingTags;
            }
        }
        return matchingTags;
    }

    function getMentionDistanceSum(tags) {
        var sum = 0;
        var i;
        for (i in tags) {
            sum += tags[i].mentionDistance;
        }
        return sum;
    }

    function getMinMentionDistance(tags) {
        var min = Number.MAX_VALUE;
        var i;
        for (i in tags) {
            if (min > tags[i].mentionDistance) {
                min = tags[i].mentionDistance;
            }
        }
        return min;
    }

    var heap = new Heap(function(subreddit1, subreddit2) {
        // Could we make this more efficient by storing data? Currently runs decently fast anyway...

        var subreddit1Tags = getMatchingTags(subreddit1.tags);
        var subreddit2Tags = getMatchingTags(subreddit2.tags);

        var tagDifference = subreddit2Tags.length - subreddit1Tags.length;
        if (tagDifference !== 0) {
            //console.log("Result: " + tagDifference);
            return tagDifference;
        }

        var tagSumDifference = getMentionDistanceSum(subreddit1Tags) - getMentionDistanceSum(subreddit2Tags);
        if (tagSumDifference !== 0) {
            //console.log("Result: " + tagSumDifference);
            return tagSumDifference;
        }

        var tagMinDifference = getMinMentionDistance(subreddit1Tags) - getMinMentionDistance(subreddit2Tags);
        if (tagMinDifference !== 0) {
            //console.log("Result: " + tagMinDifference);
            return tagMinDifference;
        }

        // Popularity Difference
        return subreddit2.total_subscribers - subreddit1.total_subscribers;
    });


    Subreddit.find({}, function(err, parsedSubreddits) {
        for (index in parsedSubreddits) {
            heap.push(subreddit);
        }

        var output = [];
        for (index = 0; index < maxValues; index++) {
            if (heap.empty()) {
                break;
            }
            var subreddit = heap.pop();
            var subredditTagsMatched = getMatchingTags(subreddit.tags);
            output.push({
                subreddit: subreddit.url,
                rank: index,
                tagsMatched: subredditTagsMatched.length,
                tagScore: getMentionDistanceSum(subredditTagsMatched),
                depth: getMinMentionDistance(subredditTagsMatched)
            });
        }
        res.status(200);
        res.json(recSubreddits);
    }).catch(next);
});

module.exports = router;
