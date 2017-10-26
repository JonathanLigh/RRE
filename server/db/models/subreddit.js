const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const subredditSchema = new Schema({
  name: {type: String, required: true, unique: true},
  tags: [{
    tag: {type: Schema.Types.ObjectId, ref: 'Tag', required: true},
    correlation: {type: Number, defualt: 0}
  }],
  numSubscribers: {type: Number},
  _relatedSubreddits: [{type: Schema.Types.ObjectId, ref: 'Subreddit'}]
});

relationSchema.post('init', doc => {
  doc.degreeCorrelation = Utils.genCorrelationValue(doc._subreddits);
});

module.exports = mongoose.model('Subreddit', subredditSchema);
