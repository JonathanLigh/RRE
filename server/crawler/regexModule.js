module.exports = {
    getListOfMatches: function(searchText, regex, exclude, callback) {
        var matches = [];
        let m;
        while ((m = regex.exec(searchText)) !== null) {
            if (m.index === regex.lastIndex) {
                regex.lastIndex++;
            }
            m.forEach((match, groupIndex) => {
                match = match.toLowerCase();
                if (!!callback) {
                    match = callback(match);
                }
                if (match !== exclude && matches.indexOf(match) === -1) {
                    matches.push(match);
                }
            });
        }

        return matches;
    },

    getNameFromURL: function(url) {
        return url.replace(/^\/?r\/|\//gi, '').toLowerCase();
    }
}
