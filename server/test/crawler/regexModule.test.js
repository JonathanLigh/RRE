const chai = require('chai');
const spies = require('chai-spies');
chai.use(spies);
const expect = chai.expect;
var regex = require('../../crawler/regexModule')

describe('Testing getListOfMatches', () => {
    it('whenNoMatches_getListOfMatches_returnEmptyList', () => {
        // Given
        var search = "abcda";

        // When
        var matches = regex.getListOfMatches(search, /x/g);

        // Then
        expect(matches.length, 0);
    });

    it('whenHasMatches_getListOfMatches_returnMatches', () => {
        // Given
        var search = "abcda";

        // When
        var matches = regex.getListOfMatches(search, /a/g);

        // Then
        expect(matches.length, 2);
        expect(matches[0], "a");
        expect(matches[1], "a");
    });

    it('whenHasMatches_excludeValue_getListOfMatches_returnMatchesExceptExclude', () => {
        // Given
        var search = "abcda";

        // When
        var matches = regex.getListOfMatches(search, /\w/g, "a");

        // Then
        expect(matches.length, 3);
        expect(matches[0], "b");
        expect(matches[1], "c");
        expect(matches[2], "d");
    });
});

describe('Testing getNameFromURL', () => {
    it('whenUrlCapitalized_getNameFromURL_returnLowercaseName', () => {
        // Given
        var url = "/R/NAME";

        // When
        var name = regex.getNameFromURL(url);

        // Then
        expect(url, "name");
    });

    it('whenUrlBeginingSlash_getNameFromURL_returnName', () => {
        // Given
        var url = "/r/name";

        // When
        var name = regex.getNameFromURL(url);

        // Then
        expect(url, "name");
    });

    it('whenUrlEndSlash_getNameFromURL_returnName', () => {
        // Given
        var url = "r/name/";

        // When
        var name = regex.getNameFromURL(url);

        // Then
        expect(url, "name");
    });

    it('whenUrlBothSlashs_getNameFromURL_returnName', () => {
        // Given
        var url = "/r/name/";

        // When
        var name = regex.getNameFromURL(url);

        // Then
        expect(url, "name");
    });

    it('whenUrlManySlashs_getNameFromURL_returnName', () => {
        // Given
        var url = "////r/name////";

        // When
        var name = regex.getNameFromURL(url);

        // Then
        expect(url, "name");
    });
});
