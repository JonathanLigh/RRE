'use strict';
require('dotenv').config()

const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const config = {
    key: fs.readFileSync(path.resolve('server/file.pem')),
    cert: fs.readFileSync(path.resolve('server/file.crt')),
    passphrase: process.env.PASS
}

const server = require('https').createServer(config);
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
    .catch(err => {
        console.error(chalk.red(err.stack));
        process.exit(1);
    });
