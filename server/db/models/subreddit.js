const db = require('../db');
const DataTypes = db.Sequelize;

//  Defines the Subreddit Schema

module.exports = db.define('subreddit', {
  url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  numSubscribers: {
    type: DataTypes.INTEGER,
    required: false
  },
  isNSFW: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    required: true
  }
});
