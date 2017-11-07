const chai = require('chai');
const spies = require('chai-spies');
chai.use(spies);
const equalTo = chai.assert.strictEqual;
const crawler = require('../../crawler/crawler');
const models = require('../../db/models');
const Subreddit = models.Subreddit;
const fs = require('fs');

describe('helper functions', () => {
    describe('Testing buildURL', () => {
        it('buildURL_noAfter', () => {
            // When
            var url = crawler._buildURL();

            // Then
            equalTo(url, "https://www.reddit.com/reddits.json?limit=1");
        });

        it('buildURL_emptyStringAfter', () => {
            // Given
            var after = "";

            // When
            var url = crawler._buildURL(after);

            // Then
            equalTo(url, "https://www.reddit.com/reddits.json?limit=1");
        });

        it('buildURL_validAfter', () => {
            // Given
            var after = "test";

            // When
            var url = crawler._buildURL(after);

            // Then
            equalTo(url, "https://www.reddit.com/reddits.json?limit=1&after=test");
        });
    });
});

var testSubreddit;

describe('Subreddit Operations', () => {
    beforeEach(done => {
        testSubreddit = Subreddit.create({
            name: '/r/SRTest1',
            tags: [],
            numSubscribers: 100,
            _relatedSubreddits: []
        }).then(() => {
            done();
        }).catch(done);
    });

    afterEach(done => {
        Subreddit.remove({}).then(() => {
            done();
        })
    });

    describe('Testing updateSubreddit', () => {
        it('whenExistingData_updateSubreddit_entryUpdated', () => {
            Subreddits.find({
                name: '/r/SRTest1'
            }).exec().then(subreddit => {
                // Given
                var updateData = [{
                    tag: "testTag",
                    mentionDistance: 0
                }];

                subreddit.tags = updateData;

                // When
                crawler._updateSubreddit(subreddit, function(updatedSubreddit) {
                    // Then
                    equalTo(updatedSubreddit.tags, updateData);
                });
            });
        });
    });

    describe('Testing updateTag', () => {
        it('whenTagsEmpty_updateTag_tagCreated', () => {
            // Given
            var subredditData = {
                tags: []
            };
            var newTag = {
                tag: "tag",
                mentionDistance: 0
            };
            var depth = 0;

            // When
            var updated = crawler._updateTag(subredditData, newTag, depth);

            // Then
            equalTo(updated, true);
            equalTo(subredditData.tags.length, 1);
            equalTo(subredditData.tags[0].tag, newTag.tag);
        });

        it('whenTagExists_updateTag_closerDistance_tagUpdated', () => {
            // Given
            var subredditData = {
                tags: [{
                    tag: "tag",
                    mentionDistance: 1
                }]
            };
            var newTag = {
                tag: "tag",
                mentionDistance: 0
            };
            var depth = 0;

            // When
            var updated = crawler._updateTag(subredditData, newTag, depth);

            // Then
            equalTo(updated, true);
            equalTo(subredditData.tags.length, 1);
            equalTo(subredditData.tags[0].tag, newTag.tag);
            equalTo(subredditData.tags[0].mentionDistance, depth);
        });

        it('whenTagExists_updateTag_fartherDistance_tagNotUpdated', () => {
            // Given
            var subredditData = {
                tags: [{
                    tag: "tag",
                    mentionDistance: 0
                }]
            };
            var newTag = {
                tag: "tag",
                mentionDistance: 0
            };
            var depth = 1;

            // When
            var updated = crawler._updateTag(subredditData, newTag, depth);

            // Then
            equalTo(updated, false);
            equalTo(subredditData.tags.length, 1);
            equalTo(subredditData.tags[0].mentionDistance, 0);
        });
    });

    describe('Testing propogateSubredditData', () => {
        it('whenNewSubreddit_propogateSubredditData_oneRelation_createsRelation_createsTags', () => {
            // Given
            var subredditURL = "/r/child";
            var parentSubredditData = {
                url: "/r/parent",
                tags: [{
                    tag: "tag",
                    mentionDistance: 0
                }],
                name: "test_parent",
                relatedSubreddits: ["r/child"]
            };
            var depth = 1;
            var searched = [];

            crawler._writeSubreddit("parent", parentSubredditData);

            // When
            crawler._propagateSubredditData(subredditURL, parentSubredditData, depth, searched);

            // Then
            equalTo(fs.existsSync(testDir + "child.json"), true);
            equalTo(fs.existsSync(testDir + "parent.json"), true);

            var childData = JSON.parse(fs.readFileSync(testDir + "child.json"));
            var parentData = JSON.parse(fs.readFileSync(testDir + "parent.json"));

            equalTo(childData.relatedSubreddits.length, 1);
            equalTo(childData.relatedSubreddits[0], "r/parent");
            equalTo(childData.tags.length, 1);
            equalTo(childData.tags[0].tag, "tag");
            equalTo(childData.tags[0].mentionDistance, 1);

            equalTo(parentData.relatedSubreddits.length, 1);
            equalTo(parentData.relatedSubreddits[0], "r/child");
            equalTo(parentData.tags.length, 1);
            equalTo(parentData.tags[0].tag, "tag");
            equalTo(parentData.tags[0].mentionDistance, 0);
        });

        it('whenExistingSubredditWithTags_propogateSubredditData_oneRelation_createsRelation_updatesAndPropagatesTags', () => {
            // Given
            var subredditURL = "/r/existing";
            var parentSubredditData = {
                url: "/r/parent",
                tags: [{
                    tag: "parentTag",
                    mentionDistance: 0
                }],
                name: "test_parent",
                relatedSubreddits: ["r/existing"]
            };
            var depth = 1;
            var searched = [];

            crawler._writeSubreddit("parent", parentSubredditData);

            var existingSubredditData = {
                url: subredditURL,
                tags: [{
                    tag: "existingTag",
                    mentionDistance: 0
                }],
                name: "test_existing",
                relatedSubreddits: []
            };

            crawler._writeSubreddit("existing", existingSubredditData);

            // When
            crawler._propagateSubredditData(subredditURL, parentSubredditData, depth, searched);

            // Then
            equalTo(fs.existsSync(testDir + "existing.json"), true);
            equalTo(fs.existsSync(testDir + "parent.json"), true);

            var existingData = JSON.parse(fs.readFileSync(testDir + "existing.json"));
            var parentData = JSON.parse(fs.readFileSync(testDir + "parent.json"));

            equalTo(existingData.relatedSubreddits.length, 1);
            equalTo(existingData.relatedSubreddits[0], "r/parent");
            equalTo(existingData.tags.length, 2);
            equalTo(existingData.tags[0].tag, "existingTag");
            equalTo(existingData.tags[0].mentionDistance, 0);
            equalTo(existingData.tags[1].tag, "parentTag");
            equalTo(existingData.tags[1].mentionDistance, 1);

            equalTo(parentData.relatedSubreddits.length, 1);
            equalTo(parentData.relatedSubreddits[0], "r/existing");
            equalTo(parentData.tags.length, 2);
            equalTo(parentData.tags[0].tag, "parentTag");
            equalTo(parentData.tags[0].mentionDistance, 0);
            equalTo(parentData.tags[1].tag, "existingTag");
            equalTo(parentData.tags[1].mentionDistance, 2);
        });
    });

    describe('Testing parseSubreddit', () => {
        it('whenCreatingSubreddit_parseSubreddit_subredditCreated', () => {
            // Given
            var subreddit = {
                url: "/r/parent",
                audience_target: "",
                name: "test_parent",
                subscribers: 1,
                description: ""
            }

            // When
            crawler._parseSubreddit(subreddit);

            // Then
            equalTo(fs.existsSync(testDir + "parent.json"), true);

            var parentData = JSON.parse(fs.readFileSync(testDir + "parent.json"));

            equalTo(parentData.relatedSubreddits.length, 0);
            equalTo(parentData.tags.length, 0);
            equalTo(parentData.url, "/r/parent");
            equalTo(parentData.name, "test_parent");
            equalTo(parentData.total_subscribers, 1);
        });

        it('whenCreatingSubreddit_withAudienceTarget_parseSubreddit_subredditCreated', () => {
            // Given
            var subreddit = {
                url: "/r/parent",
                audience_target: "tag",
                name: "test_parent",
                subscribers: 1,
                description: ""
            }

            // When
            crawler._parseSubreddit(subreddit);

            // Then
            equalTo(fs.existsSync(testDir + "parent.json"), true);

            var parentData = JSON.parse(fs.readFileSync(testDir + "parent.json"));

            equalTo(parentData.relatedSubreddits.length, 0);
            equalTo(parentData.tags.length, 1);
            equalTo(parentData.tags[0].tag, "tag");
            equalTo(parentData.tags[0].mentionDistance, 0);
            equalTo(parentData.url, "/r/parent");
            equalTo(parentData.name, "test_parent");
            equalTo(parentData.total_subscribers, 1);
        });

        it('whenCreatingSubreddit_withDescription_parseSubreddit_subredditAndChildCreated', () => {
            // Given
            var subreddit = {
                url: "/r/parent",
                audience_target: "",
                name: "test_parent",
                subscribers: 1,
                description: "/r/child"
            }

            // When
            crawler._parseSubreddit(subreddit);

            // Then
            equalTo(fs.existsSync(testDir + "parent.json"), true);

            var parentData = JSON.parse(fs.readFileSync(testDir + "parent.json"));

            equalTo(parentData.relatedSubreddits.length, 1);
            equalTo(parentData.relatedSubreddits[0], "r/child");
            equalTo(parentData.tags.length, 0);
            equalTo(parentData.url, "/r/parent");
            equalTo(parentData.name, "test_parent");
            equalTo(parentData.total_subscribers, 1);

            equalTo(fs.existsSync(testDir + "child.json"), true);

            var childData = JSON.parse(fs.readFileSync(testDir + "child.json"));

            equalTo(childData.relatedSubreddits.length, 1);
            equalTo(childData.relatedSubreddits[0], "r/parent");
            equalTo(childData.tags.length, 0);
            equalTo(childData.url, "r/child");
        });

        it('whenUpdatingSubreddit_parseSubreddit_subredditUpdated', () => {
            // Given
            var parentSubredditData = {
                url: "/r/parent",
                tags: [],
                relatedSubreddits: []
            };

            crawler._writeSubreddit("parent", parentSubredditData);

            var subreddit = {
                url: "/r/parent",
                audience_target: "",
                name: "test_parent",
                subscribers: 1,
                description: ""
            }

            // When
            crawler._parseSubreddit(subreddit);

            // Then
            equalTo(fs.existsSync(testDir + "parent.json"), true);

            var parentData = JSON.parse(fs.readFileSync(testDir + "parent.json"));

            equalTo(parentData.relatedSubreddits.length, 0);
            equalTo(parentData.tags.length, 0);
            equalTo(parentData.url, "/r/parent");
            equalTo(parentData.name, "test_parent");
            equalTo(parentData.total_subscribers, 1);
        });
    });
});
