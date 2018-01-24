const db = require('../db');
const DataTypes = db.Sequelize;

//  Defines the Tag Schema

module.exports = db.define('tag', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  }
});
