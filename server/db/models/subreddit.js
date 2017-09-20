const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const subredditSchema = new Schema({
  name: {type: String, required: true, unique: true},
  tags: [{type: String}],
  numSubscribers: {type: Number}
});


module.exports = mongoose.model('Subreddit', subredditSchema);
