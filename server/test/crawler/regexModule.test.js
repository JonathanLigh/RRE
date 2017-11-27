const chai = require('chai');
const spies = require('chai-spies');
chai.use(spies);
const equalTo = chai.assert.strictEqual;
const regex = require('../../crawler/regexModule')
const models = require('../../db/models');
const Subreddit = models.Subreddit;
const Tag = models.Tag;

describe('Testing getListOfMatches', () => {

    it('whenNoMatches_getListOfMatches_returnEmptyList', () => {
        // Given
        var search = "abcda";

        // When
        var matches = regex.getListOfMatches(search, /x/g);

        // Then
        equalTo(matches.length, 0);
    });

    it('whenHasMatches_getListOfMatches_returnMatches', () => {
        // Given
        var search = "abcd";

        // When
        var matches = regex.getListOfMatches(search, /a/g);

        // Then
        equalTo(matches.length, 1);
        equalTo(matches[0], "a");
    });

    it('whenHasMultipleMatches_getListOfMatches_returnOnlyUniqueMatches', () => {
        // Given
        var search = "abcda";

        // When
        var matches = regex.getListOfMatches(search, /a/g);

        // Then
        equalTo(matches.length, 1);
        equalTo(matches[0], "a");
    });

    it('whenHasMatches_excludeValue_getListOfMatches_returnMatchesExceptExclude', () => {
        // Given
        var search = "abcda";

        // When
        var matches = regex.getListOfMatches(search, /\w/g, "a");

        // Then
        equalTo(matches.length, 3);
        equalTo(matches[0], "b");
        equalTo(matches[1], "c");
        equalTo(matches[2], "d");
    });
});

describe('Testing getNameFromURL', () => {

    it('whenUrlCapitalized_getNameFromURL_returnLowercaseName', () => {
        // Given
        var url = "/R/NAME";

        // When
        var name = regex.getNameFromURL(url);

        // Then
        equalTo(name, "name");
    });

    it('whenUrlBeginingSlash_getNameFromURL_returnName', () => {
        // Given
        var url = "/r/name";

        // When
        var name = regex.getNameFromURL(url);

        // Then
        equalTo(name, "name");
    });

    it('whenUrlEndSlash_getNameFromURL_returnName', () => {
        // Given
        var url = "r/name/";

        // When
        var name = regex.getNameFromURL(url);

        // Then
        equalTo(name, "name");
    });

    it('whenUrlBothSlashs_getNameFromURL_returnName', () => {
        // Given
        var url = "/r/name/";

        // When
        var name = regex.getNameFromURL(url);

        // Then
        equalTo(name, "name");
    });
});
