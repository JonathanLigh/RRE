const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const subredditSchema = new Schema({
    url: {
        type: String,
        required: true,
        unique: true
    },
    tags: [{
        name: {
            type: String,
            required: false
        },
        distance: {
            type: Number,
            required: false
        }
    }],
    numSubscribers: {
        type: Number,
        required: false
    },
    _relatedSubreddits: [{
        type: String
    }]
});

module.exports = mongoose.model('Subreddit', subredditSchema);
