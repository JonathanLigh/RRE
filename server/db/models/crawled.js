'use strict';

const db = require('../db');
const DataTypes = db.Sequelize;

// map of all crawled subreddits
// max size of this entry is reasonably capped at 1.2M subreddits * 32B (per entry)  ~= 38.4MB
//
module.exports = db.define('crawled', {
    version: {
        type: DataTypes.STRING,
        allowNull: false,
        isUnique: true
    },
    visitedMap: {
        type: DataTypes.JSON,
        allowNull: false
    }
  });