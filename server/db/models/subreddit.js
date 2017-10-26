const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const subredditSchema = new Schema({
  name: {type: String, required: true, unique: true},
  tags: [{
    name: {type: String, required: true},
    distance: {type: Number, defualt: 0}
  }],
  numSubscribers: {type: Number},
  _relatedSubreddits: [{type: Schema.Types.ObjectId, ref: 'Subreddit'}]
});

/*
we do not use ES6 arrow functions here because it prevents binding with "this"
ref: http://mongoosejs.com/docs/guide.html
takes:
  subredditName
returns:
  the query for finding each
*/
subredditSchema.query.getTagsBySubreddit = function(name) {
  return this.findOne({name: name})
  .select('tags')
}

/*
takes:
  list of subreddit names to exclude
  list of tag names
returns:
  query to be executed that will return the most related subreddits
*/
subredditSchema.query.getSubredditsByTags = function(excludedSRNames, tagNames) {
  return this.find({
    groups: { "$nin": excludedSRNames },
    tags: [{ //no idea if this syntax is legal it compiles, so it might be
      name: {$in: tagNames },
      distance: {$leq: 5}    //arbitrary number, can be tweeked
      }],
    numSubscribers: {$geq: 500}   //arbitrary number, can be tweeked
  }).
  select('name')
}

module.exports = mongoose.model('Subreddit', subredditSchema);
