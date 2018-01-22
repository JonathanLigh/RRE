const Sequelize = require('sequelize');
const path = require('path');
const chalk = require('chalk');
const models = require('./models');
const ENV_VARIABLES = require(path.join(__dirname, '../env'));
const DATABASE_URI = ENV_VARIABLES.DATABASE_URI;
const DATABASE_USER = ENV_VARIABLES.DATABASE_USER;
const DATABASE_PASSWORD = ENV_VARIABLES.DATABASE_PASSWORD;

const db = new Sequelize(DATABASE_URI, {
  logging: false, // set to console.log to see the raw SQL queries
  native: true // lets Sequelize know we can use pg-native for ~30% more speed
})

var syncedDbPromise = db.sync();

syncedDbPromise.then(function () {
  console.log(chalk.green('Sequelize models synced to PostgreSQL'));
});
module.exports = syncedDbPromise;
