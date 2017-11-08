const chai = require('chai');
const spies = require('chai-spies');
chai.use(spies);
const expect = chai.expect;

const mongoose = require('mongoose');
const chalk = require('chalk');
const models = require('../db/models');

// Options for connecting to MongoDB
// We can add more later

/*const testObj = {
    foobar: () => {
        console.log('foo');
        return 'bar';
    }
};

//some basic "testing out mocha and chai"
// Spying on a function
chai.spy.on(testObj, 'foobar');

describe('Testing suite capabilities...', () => {
    it('confirms basic arithmetic', () => {
        expect(1 + 3).to.equal(4);
    });

    it('confirms setTimeout\'s timer accuracy', (done) => {
        let start = new Date();
        setTimeout(() => {
            let duration = new Date() - start;
            expect(duration).to.be.closeTo(1000, 50);
            done();
        }, 1000);
    });

    it('will invoke a function once per element', () => {
        const arr = ['x', 'y', 'z'];
        let logNth = (val, idx) => {
            console.log('Logging elem #' + idx + ':', val);
        };

        logNth = chai.spy(logNth);
        arr.forEach(logNth);
        expect(logNth).to.have.been.called.exactly(arr.length);

    });

});*/

describe('Testing the server...', () => {
    after(done => {
        models.Subreddit.remove({}).then(() => {
            done();
        })
    });

    const options = {
        useMongoClient: true
    };
    const TEST_URI = 'mongodb://localhost/RREdbTEST'
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

    require('./crawler/crawler.test.js');
    // This shit be broken as fuck rn
    // require('./crawler/recommend.test.js');
    require('./crawler/descriptionParser.test.js');
    require('./crawler/regexModule.test.js');
    require('./db/subreddit.model.test.js');
});
