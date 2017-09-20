'use strict';
const path = require('path');
const chalk = require('chalk');
const express = require('express');
const app = express();
module.exports = app;

// Configure our express app with static and parsing middleware with other app variables
require('./configure')(app);

// Attach the routes
app.use('/api', require('./routes'));

// If the app reaches here after the routes (errors) and is requesting a file with extension length greater than 0, give 404 response immediately
app.use(function (req, res, next) {

    if (path.extname(req.path).length > 0) {
        res.status(404).end();
    } else {
        next(null);
    }

});

// For 409 (Mongoose Conflict DB Errors)
app.use(function (err, req, res, next) {
  if (err.code === 11000) {
    res.status(409).send('Duplicate Database Creation Error');
  } else {
    next(err);
  }
});

// Otherwise, rest of server errors go here and return 500 status
app.use(function (err, req, res, next) {
    console.error(chalk.red(err), chalk.yellow(typeof next));
    console.error(chalk.red(err.stack));
    res.status(err.status || 500).send(err.message || 'Internal server error.');
});
