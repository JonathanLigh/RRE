

module.exports = {
    getJSON: function(url) {

    },
    extractSRName: function(url) {
        return url.replace('https://www.reddit.com/r/','').replace('/','');
    },
    loadStateJSON: function() {

    }
}