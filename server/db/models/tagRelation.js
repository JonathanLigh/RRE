const db = require('../db');
const DataTypes = db.Sequelize;

//  Defines the Tag Schema

module.exports = db.define('tagRelation', {
  distance: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
});
