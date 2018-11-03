'use strict';
const path = require('path');
const chalk = require('chalk');
const Sequelize = require('sequelize');

console.log(chalk.yellow('Opening connection to PostgreSQL'));

module.exports = new Sequelize(process.env.DB_URI, {
  logging: false, // set to console.log to see the raw SQL queries
  native: true, // lets Sequelize know we can use pg-native for ~30% more speed
  dialect: 'postgres'
})
