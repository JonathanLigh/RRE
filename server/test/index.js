const chai = require('chai');
const spies = require('chai-spies');
chai.use(spies);
const expect = chai.expect;

const mongoose = require('mongoose');
const chalk = require('chalk');
const models = require('../db/models');

describe('Testing the server...', () => {
    after(done => {
        models.Subreddit.remove({})
        .then(() => {
            return models.Tag.remove({})
        }).then(() => {
            done()
        }).catch(done)
    });

    const options = {
        useMongoClient: true
    };
    const TEST_URI = 'mongodb://127.0.0.1/RREdbTEST'
        // Replace mongoose's promise library using bluebird's
    mongoose.Promise = require('bluebird');
    console.log(chalk.yellow('Opening connection to MongoDB', TEST_URI));
    const db = mongoose.connect(TEST_URI, options);
    module.exports = db;

    const con = mongoose.connection;
    con.on('error', console.error.bind(console, 'mongodb connection error:'));

    //after going through all the tests we want to disconnect from the database
    after(() => {
        console.log(chalk.yellow('closing connection to MongoDB', TEST_URI));
        con.close();
    });

    // Run the rest of tests
    require('./db/subreddit.model.test.js');
    require('./routes/subreddits.routes.test.js');
    require('./routes/tags.routes.test.js');
    require('./crawler/crawler.test.js')
    require('./crawler/descriptionParser.test.js');
    require('./crawler/regexModule.test.js');
});
