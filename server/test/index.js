 const chai = require('chai');
 const spies = require('chai-spies');
 chai.use(spies);
 const expect = chai.expect;
 const db = require('../db');

 const testObj = {
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

});

describe('Testing the server...', () => {

  //after going through all the tests we want to disconnect from the database
  after(() => {
    db.disconnect();
  });

  // Run the rest of tests

  require('./crawler/crawler.test.js');
  require('./crawler/recommend.test.js');
  require('./crawler/descriptionParser.test.js');

});
