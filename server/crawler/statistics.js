var fileSystem = require('fs');
var ProgressBar = require('console-progress');
var Heap = require('heap');
const regex = require('./regexModule');

var statistics = {
    numUniqueGraphs: 0,
    largestGraph: 0,
    largestGraphSource: "",
    smallestGraph: Number.MAX_VALUE,
    smallestGraphSource: ""
};
// How many unique graphs are there?

// How many graphs lack tags?

// How deep is the most obscure relation? (at least 1000 from state experiment)
// - in regards to the 1000 depth: was that just an update cycle??
//  - (might be more complicated that the largest tag mention value due to tag switching)

// Questions this research will answer:
// Should we limit depth of relations to save on crawl speed?
//  - what should that depth be to minimize the number of disconnected graphs?
// How will this affect recommendations?

// Input a subreddit, out comes statistics about individual graph connected to that subreddit
function searchGraph(fileName, searchedSubreddits, allSearchedSubreddits) {
    // Handle self referential loops
    if (!!searchedSubreddits[fileName]) {
        return;
    }

    if (fileSystem.existsSync(`./parsed_subreddits/${fileName}.json`)) {
        subredditData = JSON.parse(fileSystem.readFileSync(`./parsed_subreddits/${fileName}.json`));

        searchedSubreddits[fileName] = true;
        allSearchedSubreddits[fileName] = true;

        if (!!subredditData.relatedSubreddits) {
            for (i in subredditData.relatedSubreddits) {
                // This check shouldnt need to exist
                if (!!subredditData.relatedSubreddits[i]) {
                    searchGraph(regex.getNameFromURL(subredditData.relatedSubreddits[i]), searchedSubreddits, allSearchedSubreddits);
                }
            }
        }
    }
}

module.exports = {
    getStatistics: function() {
        var parsedSubreddits = fileSystem.readdirSync("./parsed_subreddits/");

        console.log("Searching " + parsedSubreddits.length + " subreddits\n");

        var progressBarScale = 1000;
        var bar = ProgressBar.getNew('[:bar] :eta Seconds Remaining', {
            complete: '=',
            incomplete: ' ',
            width: 40,
            total: parsedSubreddits.length / progressBarScale
        });

        var allSearchedSubreddits = {};
        var index;
        for (index in parsedSubreddits) {
            var fileName = parsedSubreddits[index].replace('.json', '');
            if (!allSearchedSubreddits[fileName]) {
                var searchedSubreddits = {};
                searchGraph(fileName, searchedSubreddits, allSearchedSubreddits);
                statistics.numUniqueGraphs++;
                if (statistics.largestGraph < Object.keys(searchedSubreddits).length) {
                    statistics.largestGraph = Object.keys(searchedSubreddits).length;
                    statistics.largestGraphSource = "r/" + fileName;
                }
                if (statistics.smallestGraph > Object.keys(searchedSubreddits).length) {
                    statistics.smallestGraph = Object.keys(searchedSubreddits).length;
                    statistics.smallestGraphSource = "r/" + fileName;
                }
            }
            if (index % progressBarScale === 0) {
                bar.tick();
            }
        }
        console.log(statistics);
        return statistics;
    }
};

require('make-runnable/custom')({
    printOutputFrame: false
});
