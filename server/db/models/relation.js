'use strict';

const db = require('../db');
const DataTypes = db.Sequelize;

module.exports = db.define('relation', {
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true
    }
  }
});
