const chai = require('chai');
const spies = require('chai-spies');
const utils = require('../utils');
chai.use(spies);
const equalTo = chai.assert.strictEqual;
const fail = chai.assert.fail;
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
    describe('Testing updateSubreddit', () => {
        it('whenExistingData_updateSubreddit_entryUpdated', () => {
            // Given
            var subredditURL = "/r/SRTest1" + utils.uuid();
            Subreddit.create({
                url: subredditURL,
                tags: [],
                numSubscribers: 100,
                _relatedSubreddits: []
            }).then(subreddit => {
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
            var childSubredditURL = "/r/child/" + utils.uuid();
            var parentSubredditURL = "/r/parent/" + utils.uuid();
            var parentSubredditData = {
                url: parentSubredditURL,
                tags: [{
                    tag: "tag",
                    mentionDistance: 0
                }],
                name: "test_parent",
                relatedSubreddits: [childSubredditURL]
            };
            var depth = 1;
            var searched = [];

            Subreddit.create(parentSubredditData, function(err, parentSubreddit) {
                // When
                crawler._propagateSubredditData(subredditURL, parentSubreddit, depth, searched);

                // Then
                Subreddit.findOne({
                    url: subredditURL
                }, function(err, childSubreddit) {
                    if (!childSubreddit) {
                        fail("childSubreddit Not Created!");
                    }

                    equalTo(childSubreddit.relatedSubreddits.length, 1);
                    equalTo(childSubreddit.relatedSubreddits[0], parentSubredditURL);
                    equalTo(childSubreddit.tags.length, 1);
                    equalTo(childSubreddit.tags[0].tag, "tag");
                    equalTo(childSubreddit.tags[0].mentionDistance, 1);

                    equalTo(parentSubreddit.relatedSubreddits.length, 1);
                    equalTo(parentSubreddit.relatedSubreddits[0], childSubredditURL);
                    equalTo(parentSubreddit.tags.length, 1);
                    equalTo(parentSubreddit.tags[0].tag, "tag");
                    equalTo(parentSubreddit.tags[0].mentionDistance, 0);
                });
            }).catch(function(err) {
                fail("¯\\_(ツ)_/¯");
            });
        });

        it('whenExistingSubredditWithTags_propogateSubredditData_oneRelation_createsRelation_updatesAndPropagatesTags', () => {
            // Given
            var subredditURL = "/r/existing/";
            var parentSubredditData = {
                url: "/r/parent/",
                tags: [{
                    tag: "parentTag",
                    mentionDistance: 0
                }],
                name: "test_parent",
                relatedSubreddits: ["/r/existing/"]
            };
            var depth = 1;
            var searched = [];

            Subreddit.create(parentSubredditData, function(err, parentSubreddit) {
                var existingSubredditData = {
                    url: subredditURL,
                    tags: [{
                        tag: "existingTag",
                        mentionDistance: 0
                    }],
                    name: "test_existing",
                    relatedSubreddits: []
                };

                Subreddit.create(existingSubredditData, function(err, existingSubreddit) {
                    // When
                    crawler._propagateSubredditData(subredditURL, parentSubredditData, depth, searched);

                    // Then
                    equalTo(existingSubreddit.relatedSubreddits.length, 1);
                    equalTo(existingSubreddit.relatedSubreddits[0], "r/parent");
                    equalTo(existingSubreddit.tags.length, 2);
                    equalTo(existingSubreddit.tags[0].tag, "existingTag");
                    equalTo(existingSubreddit.tags[0].mentionDistance, 0);
                    equalTo(existingSubreddit.tags[1].tag, "parentTag");
                    equalTo(existingSubreddit.tags[1].mentionDistance, 1);

                    equalTo(parentSubreddit.relatedSubreddits.length, 1);
                    equalTo(parentSubreddit.relatedSubreddits[0], "r/existing");
                    equalTo(parentSubreddit.tags.length, 2);
                    equalTo(parentSubreddit.tags[0].tag, "parentTag");
                    equalTo(parentSubreddit.tags[0].mentionDistance, 0);
                    equalTo(parentSubreddit.tags[1].tag, "existingTag");
                    equalTo(parentSubreddit.tags[1].mentionDistance, 2);
                });
            }).catch(function(err) {
                fail("¯\\_(ツ)_/¯");
            });
        });
    });

    describe('Testing parseSubreddit', () => {
        it('whenCreatingSubreddit_parseSubreddit_subredditCreated', () => {
            // Given
            var subredditURL = "/r/new/";
            var subreddit = {
                url: subredditURL,
                audience_target: "",
                name: "test_new",
                subscribers: 1,
                description: ""
            }

            // When
            crawler._parseSubreddit(subreddit);

            // Then
            Subreddit.findOne({
                url: subredditURL
            }, function(err, createdSubreddit) {
                if (!createdSubreddit) {
                    fail("Subreddit Not Created");
                }

                equalTo(createdSubreddit.relatedSubreddits.length, 0);
                equalTo(createdSubreddit.tags.length, 0);
                equalTo(createdSubreddit.url, subredditURL);
                equalTo(createdSubreddit.name, "test_new");
                equalTo(createdSubreddit.total_subscribers, 1);
            }).catch(function(err) {
                fail("¯\\_(ツ)_/¯");
            });
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
