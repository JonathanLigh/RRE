const chai = require('chai');
const spies = require('chai-spies');
chai.use(spies);
const assert = chai.assert;
const expect = chai.expect;

const models = require('../../db/models');
const Subreddit = models.Subreddit;

describe('Subreddit Model', () => {
    let subreddit;
    const unfoundSubreddit = {
        url: '/r/SRTestNotFound',
        tags: [{
            name: 'tag3',
            distance: 3
        }, {
            name: 'tag2',
            distance: 2
        }],
        numSubscribers: 1004,
        _relatedSubreddits: []
    },
    existingSubreddit = {
        url: '/r/SRTest1',
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
    }

    // Before Each Test
    before(done => {
        Subreddit.create({
            url: '/r/SRTest1',
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
                url: '/r/SRTest2',
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
                Subreddit.find().getTagsBySubreddits(['/r/SRTest1', '/r/SRTest2']).exec(function(err, res) {
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
        // describe('Testing getSubredditsByTags', () => {

        // Test Case
        //   it('will', () => {
        //   });
    });
    describe('static methods', () => {
        describe('Testing findOrCreate', () => {
            it('create subreddit if it does not exist in the database', () => {
                it('unfoundSubreddit not already in database', () => {
                    Subreddit.find(unfoundSubreddit).exec()
                    .then(res => {
                        expect(res).to.be.equal([]);
                    })
                });
                it('create subreddit if it does not exist in the database', () => {

                });
            });

            it('if subreddit does not exist in database', () => {
                Subreddit.find().getTagsBySubreddits(['/r/SRTest1', '/r/SRTest2']).exec(function(err, res) {
                    return res;
                }).then(list => {
                    var list = list.map(element => element.tags)
                        .reduce((a, b) => a.concat(b), []);
                    expect(list.length).to.be.equal(10)
                });
            });
        });
    });
});
