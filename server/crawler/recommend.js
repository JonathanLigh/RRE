var fileSystem = require('fs');
var ProgressBar = require('console-progress');
var crawler = require('./crawler')
var Heap = require('heap');

var testingMode = false;

const getAllTags = () => {
    var tags = [];
    var parsedSubreddits = fileSystem.readdirSync(crawler.parsedSubredditDir(testingMode));

    console.log("Searching " + parsedSubreddits.length + " subreddits\n");

    var progressBarScale = 1000;
    var bar = ProgressBar.getNew('[:bar] :eta Seconds Remaining', {
        complete: '=',
        incomplete: ' ',
        width: 40,
        total: parsedSubreddits.length / progressBarScale
    });

    var index;
    for (index in parsedSubreddits) {
        var subreddit = JSON.parse(fileSystem.readFileSync(crawler.parsedSubredditDir(testingMode) + parsedSubreddits[index]));
        var i;
        for (i in subreddit.tags) {
            var tag = subreddit.tags[i].tag;
            if (tags.indexOf(tag) === -1) {
                tags.push(tag);
            }
        }
        if (index % progressBarScale === 0) {
            bar.tick();
        }
    }
    return tags;
};

const getRankedSubredditsForTags = (maxValues, searchTags) => {
    if (searchTags.length === 0) {
        return "Provide at least 1 tag";
    }

    // ASSUMING ALL TAGS PROVIDED ARE VALID
    console.log("SEARCHING FOR:" + searchTags);

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
    var parsedSubreddits = fileSystem.readdirSync(crawler.parsedSubredditDir(testingMode));

    var progressBarScale = 1000;
    var bar = ProgressBar.getNew('[:bar] :eta Seconds Remaining', {
        complete: '=',
        incomplete: ' ',
        width: 40,
        total: parsedSubreddits.length / progressBarScale
    });

    var stop = 0;
    for (index in parsedSubreddits) {
        var subreddit = JSON.parse(fileSystem.readFileSync(crawler.parsedSubredditDir(testingMode) + parsedSubreddits[index]));
        //console.log(subreddit);
        heap.push(subreddit);
        if (index % progressBarScale === 0) {
            bar.tick();
        }
    }

    var output = [];
    for (index = 0; index < maxValues; index++) {
        if (heap.empty()) {
            return output;
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
    return output;
};

module.exports = {
    getAllTags: getAllTags,
    getRankedSubredditsForTags: getRankedSubredditsForTags,
    _getAllTags: function() {
        testingMode = true;
        return getAllTags();
    },
    _getRankedSubredditsForTags: function(maxValue, tags) {
        testingMode = true;
        return getRankedSubredditsForTags(maxValue, tags);
    }
};

require('make-runnable/custom')({
    printOutputFrame: false
});
