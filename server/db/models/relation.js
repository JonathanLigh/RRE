//this model quantifies the relationship between collections of subreddits and rates them;

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const relationSchema = new Schema({
  degreeCorralation: {type: Number},
  _subreddits: [{type: Schema.types.ObjectId, ref: 'Subreddit', required: true, unique: true}]
});

module.exports = mongoose.model('Relation', relationSchema);
