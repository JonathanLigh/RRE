const chai = require('chai');
const spies = require('chai-spies');
chai.use(spies);
const equalTo = chai.assert.strictEqual;
var languageFilter = require('../../crawler/languageFilter');
var expect = chai.expect;

describe('Testing getWordsFromSample', () => {
    it('when_given_a_paragraph_of_words', () => {
        // Given
        var sample = "Here are a bunch of words. There are also paragraphs. \n And a bunch of punctuation too!?`~";

        // When
        var words = languageFilter.getWordsFromSample(sample);

        // Then
        expect(words).to.deep.equal(['here', 'are', 'a', 'bunch', 'of', 'words', 'there', 'are', 'also', 'paragraphs', 'and', 'a', 'bunch', 'of', 'punctuation', 'too']);
    });
});

/*
describe('Testing cleanDescription', () => {

    it('whenContainsURL_cleanDescription_urlRemoved', () => {
        // Given
        var description = "http://www.test.com and some other words";

        // When
        var cleanDescription = descriptionParser._cleanDescription(description);

        // Then
        equalTo(cleanDescription, "  and some other words");
    });

    it('whenContainsURLAndSubreddit_cleanDescription_urlRemoved_subredditRemains', () => {
        // Given
        var description = "http://www.test.com and a subreddit /r/subreddit";

        // When
        var cleanDescription = descriptionParser._cleanDescription(description);

        // Then
        equalTo(cleanDescription, "  and a subreddit /r/subreddit");
    });
});

describe('Testing getMentionedSubreddits', () => {
    it('whenContainsSubreddits_cleanDescription_returnAllSubreddits', () => {
        // Given
        var subreddit = {
            url: "/r/test0/",
            description: "r/test1 /r/test2 /r/test3\n/r/test4 //////r/test5/////// abcd/r/test6"
        }

        // When
        var subreddits = descriptionParser.getMentionedSubreddits(subreddit);

        // Then
        equalTo(subreddits.length, 6);
    });

    it('whenContainsSubredditsIncludingSelf_cleanDescription_returnAllSubredditsExceptSelf', () => {
        // Given
        var subreddit = {
            url: "/r/test1/",
            description: "r/test1 /r/test2 /r/test3\n/r/test4 //////r/test5/////// abcd/r/test6"
        }

        // When
        var subreddits = descriptionParser.getMentionedSubreddits(subreddit);

        // Then
        equalTo(subreddits.length, 5);
        equalTo(subreddits.indexOf("r/test1"), -1);
    });
});
*/
