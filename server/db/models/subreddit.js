const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const subredditSchema = new Schema({
  name: {type: String, required: true, unique: true},
  tags: [{
    tag: {type: String, required: true},
    correlation: {type: Number, required: true}
  }],
  numSubscribers: {type: Number}
});


module.exports = mongoose.model('Subreddit', subredditSchema);
