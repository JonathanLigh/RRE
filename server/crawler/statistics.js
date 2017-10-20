var fileSystem = require('fs');
var ProgressBar = require('console-progress');
var Heap = require('heap');

// How many disconnected graphs are there?
// How deep is the most obscure relation? (at least 1000 from state experiment)
//  - (might be more complicated that the largest tag mention value due to tag switching)
// Questions we need answered:
// Should we limit depth of relations to save on crawl speed?
//  - what should that depth be to minimize the number of disconnected graphs?
// How will this affect recommendations?

function search() {
    return;
}

module.exports = {
    getStatistics: function() {
        var tags = [];
        var parsedSubreddits = fileSystem.readdirSync("./parsed_subreddits/");

        console.log("Searching " + parsedSubreddits.length + " subreddits\n");

        var progressBarScale = 1000;
        var bar = ProgressBar.getNew('[:bar]', {
            complete: '=',
            incomplete: ' ',
            width: 40,
            total: parsedSubreddits.length / progressBarScale
        });

        var index;
        for (index in parsedSubreddits) {
            var subreddit = JSON.parse(fileSystem.readFileSync("./parsed_subreddits/" + parsedSubreddits[index]));
            var i;
            for (i in subreddit.tags) {
                var tag = subreddit.tags[i].tag;
                if (tags.indexOf(tag) === -1) {
                    tags.push(tag);
                }
            }
            if (index % progressBarScale === 0) {
                bar.tick();
            }
        }
        console.log(tags);
        return "Total: " + tags.length;
    }
};

require('make-runnable/custom')({
    printOutputFrame: false
});
