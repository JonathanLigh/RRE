const regex = require('./regexModule');

// Depricated
function cleanDescriptionForLanguageSearch(description) {
    return description
        .replace(/(?:https?|ftp):\/\/[\n\S]+/g, ' ') // Remove all URLs
        .replace(/\\n/g, ' ') // Convert all literal "\n" to spaces
        .replace(/[^a-zA-Z\/\s]/g, ' ') // Strip all special charactors except /. Keep a-z, A-Z, and whitespace)
        .replace(/\s+/g, ' '); // Convert all whitespace to just spaces
}

function cleanDescription(description) {
    return description
        .replace(/(?:https?|ftp):\/\/[\n\S]+/g, ' ') // Remove all URLs
}

module.exports = {
    getMentionedSubreddits: function(subreddit) {
        if (!!subreddit.description) {
            var strippedDescription = cleanDescription(subreddit.description);
            return regex.getListOfMatches(
                strippedDescription,
                /r\/\w+/gi, // matches "r/..."
                subreddit.url.replace(/^\/|\/$/g, '')); // Remove the first '/' and last '/' from '/r/subredditURL'
        }
        return [];
    }
};


//same reason as for crawler.js

const chai = require('chai');
const spies = require('chai-spies');
chai.use(spies);
const expect = chai.expect;


describe('Testing cleanDescription', () => {

  it('cleanDescription outputs expected value', () => {

  });

  it('cleanDescription throws an error when expected', () => {

  });

  it('cleanDescription does this if the subreddit does not exists', () => {

  });

});
