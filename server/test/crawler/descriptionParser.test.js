const chai = require('chai');
const spies = require('chai-spies');
chai.use(spies);
const expect = chai.expect;
var descriptionParser = require('../../crawler/descriptionParser')

describe('Testing cleanDescription', () => {

    it('whenContainsURL_cleanDescription_urlRemoved', () => {
        // Given
        var description = "http://www.test.com and some other words";

        // When
        var cleanDescription = descriptionParser._cleanDescription(description);

        // Then
        expect(cleanDescription, " and some other words");
    });

    it('whenContainsURLAndSubreddit_cleanDescription_urlRemoved_subredditRemains', () => {
        // Given
        var description = "www.test.com and a subreddit /r/subreddit";

        // When
        var cleanDescription = descriptionParser._cleanDescription(description);

        // Then
        expect(cleanDescription, " and a subreddit /r/subreddit");
    });
});

describe('Testing getMentionedSubreddits', () => {
    it('whenContainsSubreddits_cleanDescription_returnAllSubreddits', () => {
        // Given
        var description = "r/test1 /r/test2 /r/test3\n/r/test4 //////r/test5/////// abcd/r/test6";

        // When
        var subreddits = descriptionParser.getMentionedSubreddits(description);

        // Then
        expect(subreddits.length, 6);
    });
});
