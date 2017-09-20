//this model quantifies the relationship between collections of subreddits and rates them;
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Utils = require('./utilities');

const relationSchema = new Schema({
  degreeCorrelation: {type: Number, defualt: 0},
  _subreddits: [{type: Schema.Types.ObjectId, ref: 'Subreddit', required: true, unique: true}]
});

//generates a correlation on the relation schema after it initializes in the database.
relationSchema.post('init', doc => {
  doc.degreeCorrelation = Utils.genCorrelationValue(doc._subreddits);
});

module.exports = mongoose.model('Relation', relationSchema);
