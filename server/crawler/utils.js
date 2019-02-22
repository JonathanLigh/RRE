

module.exports = {
    getJSON: function(url) {

    },
    oldifySRName: function (url) {
        return url.replace('https://www.reddit.com/r/','https://www.old.reddit.com/r/');
    },
    extractSRName: function(url) {
        return url.replace('https://www.reddit.com/r/','').replace('/','');
    },
    loadStateJSON: function() {

    }
}