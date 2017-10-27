const chai = require('chai');
const spies = require('chai-spies');
chai.use(spies);
const assert = chai.assert;

const models = require('../../db/models');
const Subreddit = models.Subreddit;

describe('Subreddit Model', () => {
  let subreddit;

  // Before Each Test
  before(done => {
    Subreddit.create({
      name: '/r/SRTest1',
      tags: [
        {name: 'tag1', distance: 3},
        {name: 'tag2', distance: 7},
        {name: 'tag3', distance: 2},
        {name: 'tag4', distance: 2},
        {name: 'tag5', distance: 12}
       ],
      numSubscribers: 100,
      _relatedSubreddits: []
    })
    .then(() => {
      return Subreddit.create({
        name: '/r/SRTest2',
        tags: [
          {name: 'tag1', distance: 7},
          {name: 'tag2', distance: 5},
          {name: 'tag3', distance: 9},
          {name: 'tag4', distance: 10},
          {name: 'tag5', distance: 2}
         ],
        numSubscribers: 1000,
        _relatedSubreddits: []
      });
    })
    .then(() => {
        done();
    })
    .catch(done);
  });

  after(done => {
    Subreddit.remove({})
    .then(() => {
      done();
    })
  })

  describe('query helpers', () => {
    describe('Testing getTagsBySubreddits', () => {
      it('getTagsBySubreddits', () => {
        Subreddit.find().getTagsBySubreddits(['/r/SRTest1','/r/SRTest2']).exec(function (err, res) {
          return res = res.reduce((a, b) => a.concat(b), []);
        })
        .then(res => {
          console.log(res);
        })
      });
    });
  });

  describe('getSubredditsByTags', () => {

    // Test Case
    it('returns the firstName and lastName combined by a space', () => {


    });
  });
 });

