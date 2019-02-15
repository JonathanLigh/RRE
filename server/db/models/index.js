const Subreddit = require('./subreddit');
const Tag = require('./tag');
const Relation = require('./relation');
const TagRelation = require('./tagRelation');

Subreddit.belongsToMany(Subreddit, {as: 'relatedSubreddits', through: 'relation', foreignKey: 'subredditId', otherKey: 'relatedSubredditId'});
Tag.belongsToMany(Subreddit, {through: 'tagRelation'});
Subreddit.belongsToMany(Tag, {through: 'tagRelation'});

//  Consolidate all server data models to one export
module.exports = {
    Subreddit: Subreddit,
    Tag: Tag,
    Relation: Relation,
    TagRelation: TagRelation
};
