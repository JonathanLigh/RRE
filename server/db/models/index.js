const Subreddit = require('./subreddit');
const Tag = require('./tag');
const Relation = require('./relation');

Subreddit.hasMany(Relation)
Subreddit.hasMany(Tag)

//  Consolidate all server data models to one export
module.exports = {
    Subreddit: Subreddit,
    Tag: Tag,
    Relation: Relation
};
