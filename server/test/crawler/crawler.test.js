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

describe('Testing the crawler...', () => {
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

    describe('Subreddit Operations', () => {
        describe('Testing updateSubreddit', () => {
            it('whenExistingData_updateSubreddit_entryUpdated', () => {
                // Given
                var subredditURL = utils.uuid("test");
                Subreddit.create({
                    url: subredditURL,
                    tags: [],
                    numSubscribers: 100,
                    _relatedSubreddits: []
                }).then(subreddit => {
                    var updateData = [{
                        name: "testTag",
                        distance: 0
                    }];

                    subreddit.tags = updateData;

                    // When
                    crawler._updateSubreddit(subreddit, function(updatedSubreddit) {
                        if (!updatedSubreddit) {
                            fail("updatedSubreddit Not Created!");
                        }

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
                    name: "tag",
                    distance: 0
                };
                var depth = 0;

                // When
                var updated = crawler._updateTag(subredditData, newTag, depth);

                // Then
                equalTo(updated, true);
                equalTo(subredditData.tags.length, 1);
                equalTo(subredditData.tags[0].name, newTag.name);
            });

            it('whenTagExists_updateTag_closerDistance_tagUpdated', () => {
                // Given
                var subredditData = {
                    tags: [{
                        name: "tag",
                        distance: 1
                    }]
                };
                var newTag = {
                    name: "tag",
                    distance: 0
                };
                var depth = 0;

                // When
                var updated = crawler._updateTag(subredditData, newTag, depth);

                // Then
                equalTo(updated, true);
                equalTo(subredditData.tags.length, 1);
                equalTo(subredditData.tags[0].name, newTag.name);
                equalTo(subredditData.tags[0].distance, depth);
            });

            it('whenTagExists_updateTag_fartherDistance_tagNotUpdated', () => {
                // Given
                var subredditData = {
                    tags: [{
                        name: "tag",
                        distance: 0
                    }]
                };
                var newTag = {
                    name: "tag",
                    distance: 0
                };
                var depth = 1;

                // When
                var updated = crawler._updateTag(subredditData, newTag, depth);

                // Then
                equalTo(updated, false);
                equalTo(subredditData.tags.length, 1);
                equalTo(subredditData.tags[0].distance, 0);
            });
        });

        describe('Testing propogateSubredditData', () => {
            it('whenNewSubreddit_propogateSubredditData_oneRelation_createsRelation_createsTags', () => {
                // Given
                var childSubredditURL = utils.uuid("child");
                var parentSubredditURL = utils.uuid("parent");
                var parentSubredditData = {
                    url: parentSubredditURL,
                    tags: [{
                        name: "tag",
                        distance: 0
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
                        equalTo(childSubreddit.tags[0].name, "tag");
                        equalTo(childSubreddit.tags[0].distance, 1);

                        equalTo(parentSubreddit.relatedSubreddits.length, 1);
                        equalTo(parentSubreddit.relatedSubreddits[0], childSubredditURL);
                        equalTo(parentSubreddit.tags.length, 1);
                        equalTo(parentSubreddit.tags[0].name, "tag");
                        equalTo(parentSubreddit.tags[0].distance, 0);
                    });
                }).catch(function(err) {
                    console.log("¯\\_(ツ)_/¯" + err);
                });
            });

            it('whenExistingSubredditWithTags_propogateSubredditData_oneRelation_createsRelation_updatesAndPropagatesTags', () => {
                // Given
                var existingSubredditURL = utils.uuid("existing");
                var parentSubredditURL = utils.uuid("parent");
                var subredditURL = existingSubredditURL;
                var parentSubredditData = {
                    url: parentSubredditURL,
                    tags: [{
                        name: "parentTag",
                        distance: 0
                    }],
                    relatedSubreddits: [existingSubredditURL]
                };
                var depth = 1;
                var searched = [];

                Subreddit.create(parentSubredditData, function(err, parentSubreddit) {
                    var existingSubredditData = {
                        url: subredditURL,
                        tags: [{
                            name: "existingTag",
                            distance: 0
                        }],
                        relatedSubreddits: []
                    };

                    Subreddit.create(existingSubredditData, function(err, existingSubreddit) {
                        // When
                        crawler._propagateSubredditData(subredditURL, parentSubredditData, depth, searched);

                        // Then
                        equalTo(existingSubreddit.relatedSubreddits.length, 1);
                        equalTo(existingSubreddit.relatedSubreddits[0], parentSubredditURL);
                        equalTo(existingSubreddit.tags.length, 2);
                        equalTo(existingSubreddit.tags[0].name, "existingTag");
                        equalTo(existingSubreddit.tags[0].distance, 0);
                        equalTo(existingSubreddit.tags[1].name, "parentTag");
                        equalTo(existingSubreddit.tags[1].distance, 1);

                        equalTo(parentSubreddit.relatedSubreddits.length, 1);
                        equalTo(parentSubreddit.relatedSubreddits[0], existingSubredditURL);
                        equalTo(parentSubreddit.tags.length, 2);
                        equalTo(parentSubreddit.tags[0].name, "parentTag");
                        equalTo(parentSubreddit.tags[0].distance, 0);
                        equalTo(parentSubreddit.tags[1].name, "existingTag");
                        equalTo(parentSubreddit.tags[1].distance, 2);
                    });
                }).catch(function(err) {
                    console.log("¯\\_(ツ)_/¯" + err);
                });
            });
        });

        describe('Testing parseSubreddit', () => {
            it('whenCreatingSubreddit_parseSubreddit_subredditCreated', () => {
                // Given
                var subredditURL = utils.uuid("new");
                var subreddit = {
                    url: subredditURL,
                    audience_target: "",
                    subscribers: 1,
                    description: ""
                }

                // When
                crawler._parseSubreddit(subreddit, function() {
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
                        equalTo(createdSubreddit.numSubscribers, 1);
                    });
                });
            });

            it('whenCreatingSubreddit_withAudienceTarget_parseSubreddit_subredditCreated', () => {
                // Given
                var subredditURL = utils.uuid("new");
                var subreddit = {
                    url: subredditURL,
                    audience_target: "tag",
                    subscribers: 1,
                    description: ""
                }

                // When
                crawler._parseSubreddit(subreddit, function() {
                    // Then
                    Subreddit.findOne({
                        url: subredditURL
                    }, function(err, createdSubreddit) {
                        if (!createdSubreddit) {
                            fail("Subreddit Not Created");
                        }

                        equalTo(createdSubreddit.relatedSubreddits.length, 0);
                        equalTo(createdSubreddit.tags.length, 1);
                        equalTo(createdSubreddit.tags[0].name, "tag");
                        equalTo(createdSubreddit.tags[0].distance, 0);
                        equalTo(createdSubreddit.url, subredditURL);
                        equalTo(createdSubreddit.numSubscribers, 1);
                    }).catch(function(err) {
                        console.log("¯\\_(ツ)_/¯" + err);
                    });
                });
            });

            it('whenCreatingSubreddit_withDescription_parseSubreddit_subredditAndChildCreated', () => {
                // Given
                var parentSubredditURL = utils.uuid("parent");
                var childSubredditURL = utils.uuid("child");
                var subreddit = {
                    url: parentSubredditURL,
                    audience_target: "",
                    subscribers: 1,
                    description: childSubredditURL
                }

                // When
                crawler._parseSubreddit(subreddit, function() {
                    // Then
                    Subreddit.findOne({
                        url: parentSubredditURL
                    }, function(err, parentSubreddit) {
                        if (!parentSubreddit) {
                            fail("Parent Subreddit Not Created");
                        }
                        Subreddit.findOne({
                            url: childSubredditURL
                        }, function(err, childSubreddit) {
                            if (!childSubreddit) {
                                fail("Child Subreddit Not Created");
                            }

                            equalTo(parentSubreddit.relatedSubreddits.length, 1);
                            equalTo(parentSubreddit.relatedSubreddits[0], childSubredditURL);
                            equalTo(parentSubreddit.tags.length, 0);
                            equalTo(parentSubreddit.url, parentSubredditURL);
                            equalTo(parentSubreddit.numSubscribers, 1);

                            equalTo(childSubreddit.relatedSubreddits.length, 1);
                            equalTo(childSubreddit.relatedSubreddits[0], parentSubredditURL);
                            equalTo(childSubreddit.tags.length, 0);
                            equalTo(childSubreddit.url, childSubredditURL);
                        });
                    });
                });
            });

            it('whenUpdatingSubreddit_parseSubreddit_subredditUpdated', () => {
                // Given
                var subredditURL = utils.uuid("existing");
                var existingSubredditData = {
                    url: subredditURL,
                    tags: [],
                    relatedSubreddits: [],
                    numSubscribers: 1
                };
                Subreddit.create(existingSubredditData, function(err, existingSubreddit) {
                    var subreddit = {
                        url: subredditURL,
                        audience_target: "",
                        subscribers: 2,
                        description: ""
                    }

                    // When
                    crawler._parseSubreddit(subreddit, function() {
                        // Then
                        Subreddit.findOne({
                            url: subredditURL
                        }, function(err, existingSubreddit) {
                            if (!existingSubreddit) {
                                fail("Subreddit Not Found");
                            }

                            equalTo(existingSubreddit.relatedSubreddits.length, 0);
                            equalTo(existingSubreddit.tags.length, 0);
                            equalTo(existingSubreddit.url, subredditURL);
                            equalTo(existingSubreddit.numSubscribers, 2);
                        });
                    });
                }).catch(function(err) {
                    console.log("¯\\_(ツ)_/¯" + err);
                });
            });
        });

        describe('Testing parseRecursive', () => {
            it('whenCreatingMultipleSubreddits_parseRecursive_subredditsCreatedAndUpdatedCorrectly', () => {
                var existingSubredditURL = utils.uuid("existing");
                var existingSubredditData = {
                    url: existingSubredditURL,
                    tags: [{
                        name: "existingTag",
                        distance: 0
                    }, {
                        name: "toBeUpdatedTag",
                        distance: 10
                    }],
                    relatedSubreddits: [],
                    numSubscribers: 1
                };
                Subreddit.create(existingSubredditData, function(err, existingSubreddit) {
                    var discoveredSubredditURL1 = utils.uuid("discovered1");
                    var discoveredSubredditURL2 = utils.uuid("discovered2");
                    var subredditsData = [{
                        data: {
                            url: discoveredSubredditURL1,
                            audience_target: "toBeUpdatedTag",
                            subscribers: 2,
                            description: existingSubredditURL
                        }
                    }, {
                        data: {
                            url: discoveredSubredditURL2,
                            audience_target: "newTag",
                            subscribers: 2,
                            description: discoveredSubredditURL1
                        }
                    }];

                    // When
                    crawler._parseRecursive(subredditsData, function() {

                        // Then
                        Subreddit.findOne({
                            url: existingSubredditURL
                        }, function(err, existingSubreddit) {
                            if (!existingSubreddit) {
                                fail("Subreddit Not Found");
                            }

                            equalTo(existingSubreddit.relatedSubreddits.length, 1);
                            equalTo(existingSubreddit.tags.length, 3);
                            var matchedCount = 0;
                            var i;
                            for (i in existingSubreddit.tags) {
                                var tag = existingSubreddit.tags[i];
                                if (tag.name === "existingTag") {
                                    matchedCount++;
                                    equalTo(tag.distance, 0);
                                }
                                if (tag.name === "toBeUpdatedTag") {
                                    matchedCount++;
                                    equalTo(tag.distance, 1);
                                }
                                if (tag.name === "newTag") {
                                    matchedCount++;
                                    equalTo(tag.distance, 2);
                                }
                            }
                            equalTo(matchedCount, 3);
                        });
                    });
                }).catch(function(err) {
                    console.log("¯\\_(ツ)_/¯" + err);
                });
            });
        });
    });
});
