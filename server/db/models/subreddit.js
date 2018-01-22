const db = require('../db');
const DataTypes = db.Sequelize;

//  Defines the Subreddit Schema

module.exports = db.define('subreddit', {
  url: {
    type: DataTypes.STRING,
    allowNull: false
  },
  numSubscribers: {
    type: DataTypes.INTEGER,
    required: false
  }
});

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
