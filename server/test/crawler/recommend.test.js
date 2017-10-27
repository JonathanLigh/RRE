const chai = require('chai');
const spies = require('chai-spies');
chai.use(spies);
const equalTo = chai.assert.strictEqual;
const recommend = require('../../crawler/recommend.js')
var fs = require('fs');

var testDir = crawler.parsedSubredditDir(true);

var deleteDir = function(path) {
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach(function(file, index) {
            var curPath = path + "/" + file;
            fs.unlinkSync(curPath);
        });
        fs.rmdirSync(path);
    }
};

var createCleanDir = function(path) {
    if (fs.existsSync(path)) {
        deleteDir(path);
    }
    fs.mkdirSync(testDir);
};

describe('Testing buildURL', () => {

    it('getAllTags returns ALL tags', () => {

    });

    it('getAllTags does this if no there are no tags to get', () => {

    });

    it('getAllTags throws an error when ...', () => {

    });

});

describe('Testing getRankedSubredditsForTags', () => {

    it('getRankedSubredditsForTags outputs expected value', () => {

    });

    it('getRankedSubredditsForTags throws an error when expected', () => {

    });

    it('getRankedSubredditsForTags does this if the subreddit does not exists', () => {

    });

});
