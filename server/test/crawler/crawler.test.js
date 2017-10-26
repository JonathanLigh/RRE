//we will move these to the top, but in the mean time they can be here
const chai = require('chai');
const spies = require('chai-spies');
chai.use(spies);
const expect = chai.expect;
var crawler = require('../../crawler/crawler');
var fs = require('fs');

/*
For the first few functions I wrote a bunch of example possible tests
that you could run. But it's entirely up to you, also it might be possible for
you to put these tests at the end of the files that they are testing. We can do
this because our test comand runs "mocha filepath" mocha automatically searches
for testing syntax and executes them, that means you can have tests in your
files that only execute during testing. However, I absolutely recomend a great
refactoring now that we have it functioning. -Jonathan
*/

describe('Testing buildURL', () => {
    it('buildURL_noAfter', () => {
        // Given

        // When
        var url = crawler._buildURL();

        // Then
        expect(url, "https://www.reddit.com/reddits.json?limit=1");
    });

    it('buildURL_emptyStringAfter', () => {
        // Given
        var after = ""

        // When
        var url = crawler._buildURL(after);

        // Then
        expect(url, "https://www.reddit.com/reddits.json?limit=1");
    });

    it('buildURL_validAfter', () => {
        // Given
        var after = "test"

        // When
        var url = crawler._buildURL(after);

        // Then
        expect(url, "https://www.reddit.com/reddits.json?limit=1&after=test");
    });
});

describe('Testing writeSubreddit', () => {
    beforeEach(() => {
        fs.mkdirSync("../../crawler/" + crawler.parsedSubredditFolder(true));
    });

    afterEach(() => {
        fs.unlinkSync("../../crawler/" + crawler.parsedSubredditFolder(true));
    });

    it('whenNewData_writeSubreddit_fileCreated', () => {
        // Given
        var fileName = "a";
        var data = {
            "test": "test"
        }

        // When
        crawler._writeSubreddit(fileName, data);

        // Then
        expect(fs.existsSync(crawler.parsedSubredditFolder(true) + fileName + ".json"), true);
        var readData = fs.readFileSync(parsedSubredditFolder(true) + fileName + ".json");
        expect(readData.test, data.test);
    });

    it('whenExistingData_writeSubreddit_fileUpdated', () => {
        // Given
        var fileName = "a";
        var data = {
            "test": "test"
        };
        crawler._writeSubreddit(fileName, data);
        var updateData = {
            "test": "test2"
        };

        // When
        crawler._writeSubreddit(fileName, updateData);

        // Then
        expect(fs.existsSync(crawler.parsedSubredditFolder(true) + fileName + ".json"), true);
        var readData = fs.readFileSync(parsedSubredditFolder(true) + fileName + ".json");
        expect(readData.test, data.test);
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
        expect(updated, true);
        expect(subredditData.tags.length, 1);
        expect(subredditData.tags[0].tag, newTag.tag);
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
        var updated = updateTag(subredditData, newTag, depth);

        // Then
        expect(updated, true);
        expect(subredditData.tags.length, 1);
        expect(subredditData.tags[0].tag, newTag.tag);
        expect(subredditData.tags[0].mentionDistance, depth);
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
        var updated = updateTag(subredditData, newTag, depth);

        // Then
        expect(updated, false);
        expect(subredditData.tags.length, 1);
        expect(subredditData.tags[0].mentionDistance, 0);
    });
});

describe('Testing propogateSubredditData', () => {
    beforeEach(() => {
        fs.mkdirSync("../../crawler/" + crawler.parsedSubredditFolder(true));
    });

    afterEach(() => {
        fs.unlinkSync("../../crawler/" + crawler.parsedSubredditFolder(true));
    });

    it('whenNewSubreddit_propogateSubredditData_oneRelation_createsRelation_createsTags', () => {
        // Given
        var subredditURL = "/r/child";
        var parentSubredditData = {
            url: "/r/parent",
            tags: [{
                tag: "tag"
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
        expect(fs.existsSync(crawler.parsedSubredditFolder(true) + "child.json"), true);
        expect(fs.existsSync(crawler.parsedSubredditFolder(true) + "parent.json"), true);

        var childData = fs.readFileSync(parsedSubredditFolder(true) + "child.json");
        var parentData = fs.readFileSync(parsedSubredditFolder(true) + "parent.json");

        expect(childData.relatedSubreddits.length, 1);
        expect(childData.relatedSubreddits[0], "r/parent");
        expect(childData.tags.length, 1);
        expect(childData.tags[0].tag, "tag");
        expect(childData.tags[0].mentionDistance, 1);

        expect(parentData.relatedSubreddits.length, 1);
        expect(parentData.relatedSubreddits[0], "r/child");
        expect(parentData.tags.length, 1);
        expect(parentData.tags[0].tag, "tag");
        expect(parentData.tags[0].mentionDistance, 0);
    });

    it('whenExistingSubredditWithTags_propogateSubredditData_oneRelation_createsRelation_updatesAndPropagatesTags', () => {
        // Given
        var subredditURL = "/r/existing";
        var parentSubredditData = {
            url: "/r/parent",
            tags: [{
                tag: "parentTag"
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
                tag: "existingTag"
                mentionDistance: 0
            }],
            name: "test_existing",
            relatedSubreddits: []
        };

        crawler._writeSubreddit("existing", existingSubredditData);

        // When
        crawler._propagateSubredditData(subredditURL, parentSubredditData, depth, searched);

        // Then
        expect(fs.existsSync(crawler.parsedSubredditFolder(true) + "existing.json"), true);
        expect(fs.existsSync(crawler.parsedSubredditFolder(true) + "parent.json"), true);

        var existingData = fs.readFileSync(parsedSubredditFolder(true) + "existing.json");
        var parentData = fs.readFileSync(parsedSubredditFolder(true) + "parent.json");

        expect(existingData.relatedSubreddits.length, 1);
        expect(existingData.relatedSubreddits[0], "r/parent");
        expect(existingData.tags.length, 2);
        expect(existingData.tags[0].tag, "existingTag");
        expect(existingData.tags[0].mentionDistance, 0);
        expect(existingData.tags[0].tag, "parentTag");
        expect(existingData.tags[0].mentionDistance, 1);

        expect(parentData.relatedSubreddits.length, 1);
        expect(parentData.relatedSubreddits[0], "r/existing");
        expect(parentData.tags.length, 2);
        expect(parentData.tags[0].tag, "parentTag");
        expect(parentData.tags[0].mentionDistance, 0);
        expect(parentData.tags[0].tag, "existingTag");
        expect(parentData.tags[0].mentionDistance, 2);
    });
});

describe('Testing parseSubreddit', () => {
    beforeEach(() => {
        fs.mkdirSync("../../crawler/" + crawler.parsedSubredditFolder(true));
    });

    afterEach(() => {
        fs.unlinkSync("../../crawler/" + crawler.parsedSubredditFolder(true));
    });

    it('whenCreatingSubreddit_parseSubreddit_subredditCreated', () => {

    });

    it('whenUpdatingSubreddit_parseSubreddit_subredditUpdated', () => {

    });

    it('whenUpdatingSubredditWithRelations_parseSubreddit_subredditAndRelationsUpdated', () => {

    });
});
