'use strict';

const db = require('../db');
const DataTypes = db.Sequelize;

// possible concern:
// no easy way to update dominated relation distances
module.exports = db.define('relation', {
  distance: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
});
