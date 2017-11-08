const chai = require('chai');
const spies = require('chai-spies');
chai.use(spies);
const assert = chai.assert;
const expect = chai.expect;

const models = require('../../db/models');
const Subreddit = models.Subreddit;
const utils = require('../utils');

describe('Subreddit Model', () => {
    var subreddit1 = utils.uuid("test1");
    var subreddit2 = utils.uuid("test2");

    // Before Each Test
    before(done => {
        Subreddit.create({
            url: subreddit1,
            tags: [{
                name: 'tag1',
                distance: 3
            }, {
                name: 'tag2',
                distance: 7
            }, {
                name: 'tag3',
                distance: 2
            }, {
                name: 'tag4',
                distance: 2
            }, {
                name: 'tag5',
                distance: 12
            }],
            numSubscribers: 100,
            _relatedSubreddits: []
        }).then(() => {
            return Subreddit.create({
                url: subreddit2,
                tags: [{
                    name: 'tag1',
                    distance: 7
                }, {
                    name: 'tag2',
                    distance: 5
                }, {
                    name: 'tag3',
                    distance: 9
                }, {
                    name: 'tag4',
                    distance: 10
                }, {
                    name: 'tag5',
                    distance: 2
                }],
                numSubscribers: 1000,
                _relatedSubreddits: []
            });
        }).then(() => {
            done();
        }).catch(done);
    });

    after(done => {
        Subreddit.remove({}).then(() => {
            done();
        })
    })

    describe('query helpers', () => {
        describe('Testing getTagsBySubreddits', () => {
            it('it gets all tags from all subreddit names in argument', () => {
                Subreddit.find().getTagsBySubreddits([subreddit1, subreddit2]).exec(function(err, res) {
                    return res;
                }).then(list => {
                    var list = list.map(element => element.tags)
                        .reduce((a, b) => a.concat(b), []);
                    expect(list.length).to.be.equal(10)
                });
            });

            it('it gets no tags if no subreddits are in argument', () => {
                Subreddit.find().getTagsBySubreddits(['']).exec(function(err, res) {
                    return res;
                }).then(list => {
                    var list = list.map(element => element.tags)
                        .reduce((a, b) => a.concat(b), []);
                    expect(list.length).to.be.equal(0)
                });
            });
        });

        // TO ADD:
        // test find or create
        // if not found, creates with correct data
        // if found, loads existing

        //this can wait for when we incorporate the algorithm into the backend routes
        // describe('Testing getSubredditsByTags', () => {

        // Test Case
        //   it('will', () => {
        //   });
    });
});
