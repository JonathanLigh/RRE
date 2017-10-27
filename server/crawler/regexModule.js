module.exports = {
    getListOfMatches: function(searchText, regex, exclude) {
        var matches = [];
        let m;
        while ((m = regex.exec(searchText)) !== null) {
            if (m.index === regex.lastIndex) {
                regex.lastIndex++;
            }
            m.forEach((match, groupIndex) => {
                match = match.toLowerCase();
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
