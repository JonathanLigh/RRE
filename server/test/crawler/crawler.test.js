const chai = require('chai');
const spies = require('chai-spies');
chai.use(spies);
const expect = chai.expect;

// writeSubreddit
// propogateSubredditData
// updateTags
// loadStateJSON

/*
For the first few functions I wrote a bunch of example possible tests
that you could run. But it's entirely up to you, also it might be possible for
you to put these tests at the end of the files that they are testing. We can do
this because our test comand runs "mocha filepath" mocha automatically searches
for testing syntax and executes them, that means you can have tests in your
files that only execute during testing. However, I absolutely recomend a great
refactoring now that we have it functioning. -Jonathan
*/

//delete this file when we are all on the same page

describe('Testing buildURL', () => {

  it('buildURL correctly builds the URL', () => {

  });

  it('buildURL does this if no batchsize', () => {

  });

  it('buildURL does this if no argument specified', () => {

  });

  it('buildURL throws an error when ...', () => {

  });
//etc...
});

describe('Testing parseSubreddit', () => {

  it('parseSubreddit outputs expected value', () => {

  });

  it('parseSubreddit throws an error when expected', () => {

  });

  it('parseSubreddit does this if the subreddit does not exists', () => {

  });

});

describe('Testing writeSubreddit', () => {

  it('writeSubreddit outputs expected value', () => {

  });

  it('writeSubreddit throws an error when expected', () => {

  });

  it('writeSubreddit does this if the subreddit does not exists', () => {

  });

});
