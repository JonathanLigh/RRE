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
                subreddit.url, // Remove the first '/' and last '/' from '/r/subredditURL'
                function(match) {
                    return "/" + match.toLowerCase() + "/"; // make the match follow the default url format of /r/subredditURL
                });
        }
        return [];
    },
    _cleanDescription: function(description) {
        return cleanDescription(description);
    }
};

// regex.removeSlashesFromSubredditURL(subreddit.url).toLowerCase(), // Remove the first '/' and last '/' from '/r/subredditURL'
