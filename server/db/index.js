const Sequelize = require('sequelize');
const path = require('path');
const chalk = require('chalk');
const models = require('./models');
const db = require('./db');


var syncedDbPromise = db.sync();

syncedDbPromise.then(function () {
  console.log(chalk.green('Sequelize models synced to PostgreSQL'));
});
module.exports = syncedDbPromise;
