//this model quantifies the relationship between collections of subreddits and rates them;
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//  define the Tag schema
const tagSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true
    }
});

//  Creates the Tag model in the database
//  Also exports the Tag object for other files to use it
module.exports = mongoose.model('Tag', tagSchema);
