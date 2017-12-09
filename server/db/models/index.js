const Subreddit = require('./subreddit');
const Tag = require('./tag');

//  Consolidate all server data models to one export
module.exports = {
    Subreddit: Subreddit,
    Tag: Tag
};
