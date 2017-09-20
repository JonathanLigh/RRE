'use strict';

const chalk = require('chalk'); // great for highlighting critical info in server logs
const server = require('http').createServer();
const app = require('./app');

const startDb = require('./db');

const createApplication = () => {
  server.on('request', app);
};

const startServer = () => {
  const PORT = process.env.PORT || 8080;
  server.listen(PORT, () => {
    console.log(chalk.blue('server started on port', chalk.magenta(PORT)));
  });
};

startDb
  .then(createApplication)
  .then(startServer)
  .catch(err => { //on error, print the stack and exit the process
    process.error(chalk.red(err.stack));
    process.exit(1);
  });
