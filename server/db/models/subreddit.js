const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//  Defines the Subreddit Schema
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

//  Creates the Subreddit collection in the database
//  Also exports the Subreddit object for other files to use
module.exports = mongoose.model('Subreddit', subredditSchema);
