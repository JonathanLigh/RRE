const chai = require('chai');
const spies = require('chai-spies');
chai.use(spies);
const equalTo = chai.assert.strictEqual;
var recommend = require('../../crawler/recommend.js')
var crawler = require('../../crawler/crawler');
var fs = require('fs');

var testDir = crawler.parsedSubredditDir(true);

var deleteDir = function(path) {
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach(function(file, index) {
            var curPath = path + "/" + file;
            fs.unlinkSync(curPath);
        });
        fs.rmdirSync(path);
    }
};

var createCleanDir = function(path) {
    if (fs.existsSync(path)) {
        deleteDir(path);
    }
    fs.mkdirSync(testDir);
};

describe('Testing getAllTags', () => {
    beforeEach(() => {
        createCleanDir(testDir);
    });

    afterEach(() => {
        deleteDir(testDir);
    });

    it('getAllTags_allTagsReturned', () => {
        // Given
        var existingSubredditData = {
            url: "/r/existing",
            tags: [{
                tag: "existingTag",
                mentionDistance: 0
            }],
            name: "test_existing",
            relatedSubreddits: []
        };

        crawler._writeSubreddit("existing", existingSubredditData);

        // When
        var tags = recommend._getAllTags();

        // Then
        equalTo(tags.length, 1);
        equalTo(tags[0], "existingTag");
    });

    it('getAllTags_multipleTags_allUniqueTagsReturned', () => {
        // Given
        var existingSubredditData = {
            url: "/r/existing",
            tags: [{
                tag: "existingTag",
                mentionDistance: 0
            }],
            name: "test_existing",
            relatedSubreddits: []
        };

        crawler._writeSubreddit("existing", existingSubredditData);

        var existingSubredditData2 = {
            url: "/r/existing2",
            tags: [{
                tag: "existingTag",
                mentionDistance: 0
            }],
            name: "test_existing2",
            relatedSubreddits: []
        };

        crawler._writeSubreddit("existing2", existingSubredditData2);

        // When
        var tags = recommend._getAllTags();

        // Then
        equalTo(tags.length, 1);
        equalTo(tags[0], "existingTag");
    });
});

describe('Testing getRankedSubredditsForTags', () => {
    beforeEach(() => {
        createCleanDir(testDir);
    });

    afterEach(() => {
        deleteDir(testDir);
    });

    it('getRankedSubredditsForTags_getMostRelevantForTagQuanitity', () => {
        // Given
        var i;
        for (i = 0; i < 10; i++) {
            var tags = [];
            var j;
            for (j = 0; j < i; j++) {
                tags.push({
                    tag: "tag" + j,
                    mentionDistance: 0
                });
            }
            var existingSubredditData = {
                url: "/r/subreddit" + i,
                tags: tags,
                name: "test_subreddit" + i,
                relatedSubreddits: [],
                total_subscribers: 1
            };

            crawler._writeSubreddit("subreddit" + i, existingSubredditData);
        }

        // When
        var subreddits = recommend._getRankedSubredditsForTags(
            10, ["tag0", "tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8"]);

        // Then
        equalTo(subreddits.length, 10);
        for (i = 0; i < subreddits.length; i++) {
            equalTo(subreddits[i].subreddit, "/r/subreddit" + (9 - i));
        }
    });

    it('getRankedSubredditsForTags_getMostRelevantForTagSum', () => {
        // Given
        var i;
        for (i = 0; i < 10; i++) {
            var tags = [];
            var j;
            for (j = 0; j < 3; j++) {
                tags.push({
                    tag: "tag" + j,
                    mentionDistance: i
                });
            }
            var existingSubredditData = {
                url: "/r/subreddit" + i,
                tags: tags,
                name: "test_subreddit" + i,
                relatedSubreddits: [],
                total_subscribers: 1
            };

            crawler._writeSubreddit("subreddit" + i, existingSubredditData);
        }

        // When
        var subreddits = recommend._getRankedSubredditsForTags(
            10, ["tag0", "tag1", "tag2"]);

        // Then
        equalTo(subreddits.length, 10);
        for (i = 0; i < subreddits.length; i++) {
            equalTo(subreddits[i].subreddit, "/r/subreddit" + i);
        }
    });

    it('getRankedSubredditsForTags_getMostRelevantForTagDistance', () => {
        // Given
        var i;
        for (i = 0; i < 10; i++) {
            var tags = [];
            tags.push({
                tag: "tag0",
                mentionDistance: i
            });
            tags.push({
                tag: "tag1",
                mentionDistance: 100 - i
            });
            var existingSubredditData = {
                url: "/r/subreddit" + i,
                tags: tags,
                name: "test_subreddit" + i,
                relatedSubreddits: [],
                total_subscribers: 1
            };

            crawler._writeSubreddit("subreddit" + i, existingSubredditData);
        }

        // When
        var subreddits = recommend._getRankedSubredditsForTags(
            10, ["tag0", "tag1"]);

        // Then
        equalTo(subreddits.length, 10);
        for (i = 0; i < subreddits.length; i++) {
            equalTo(subreddits[i].subreddit, "/r/subreddit" + i);
        }
    });

    it('getRankedSubredditsForTags_getMostRelevantForSubscriberCount', () => {
        // Given
        var i;
        for (i = 0; i < 10; i++) {
            var existingSubredditData = {
                url: "/r/subreddit" + i,
                tags: [{
                    tag: "tag0",
                    mentionDistance: 0
                }],
                name: "test_subreddit" + i,
                relatedSubreddits: [],
                total_subscribers: i
            };

            crawler._writeSubreddit("subreddit" + i, existingSubredditData);
        }

        // When
        var subreddits = recommend._getRankedSubredditsForTags(
            10, ["tag0"]);

        // Then
        equalTo(subreddits.length, 10);
        for (i = 0; i < subreddits.length; i++) {
            equalTo(subreddits[i].subreddit, "/r/subreddit" + (9 - i));
        }
    });
});
