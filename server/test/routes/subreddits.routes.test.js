const chai = require('chai');
const spies = require('chai-spies');
const supertest = require('supertest');
const app = require('../../app');
chai.use(spies);
//we use the agent to send requests to our database
const agent = supertest.agent(app);
const assert = chai.assert;
const expect = chai.expect;

const models = require('../../db/models');
const Subreddit = models.Subreddit;
const utils = require('../utils');

const subreddits = [{
    url: '/r/SRTest1',
    tags: [{
        name: 'tag3',
        distance: 3
    }, {
        name: 'tag2',
        distance: 2
    }],
    numSubscribers: 1004,
    _relatedSubreddits: []
}, {
    url: '/r/SRTest2',
    tags: [{
        name: 'tag1',
        distance: 3
    }, {
        name: 'tag2',
        distance: 7
    }, {
        name: 'tag3',
        distance: 2
    }],
    numSubscribers: 10,
    _relatedSubreddits: []
}, {
    url: '/r/SRTest3',
    tags: [{
        name: 'tag1',
        distance: 3
    }, {
        name: 'tag2',
        distance: 7
    }, {
        name: 'tag3',
        distance: 2
    }],
    numSubscribers: 100,
    _relatedSubreddits: []
}, {
    url: '/r/SRTest4',
    tags: [{
        name: 'tag1',
        distance: 3
    }, {
        name: 'tag2',
        distance: 4
    }, {
        name: 'tag3',
        distance: 6
    }],
    numSubscribers: 1000,
    _relatedSubreddits: []
}, {
    url: '/r/SRTest5',
    tags: [{
        name: 'tag1',
        distance: 4
    }, {
        name: 'tag2',
        distance: 2
    }, {
        name: 'tag3',
        distance: 1
    }],
    numSubscribers: 10000,
    _relatedSubreddits: []
}, {
    url: '/r/SRTest6',
    tags: [{
        name: 'tag1',
        distance: 1
    }, {
        name: 'tag7',
        distance: 5
    }, {
        name: 'tag5',
        distance: 7
    }],
    numSubscribers: 100001,
    _relatedSubreddits: []
}, {
    url: '/r/SRTest7',
    tags: [{
        name: 'tag3',
        distance: 1
    }, {
        name: 'tag2',
        distance: 2
    }, {
        name: 'tag5',
        distance: 2
    }],
    numSubscribers: 100011,
    _relatedSubreddits: []
}]

describe('Subreddit Routes', () => {

    // Before Each Test
    before(done => {
        Subreddit.insertMany(subreddits).then(() => {
            done();
        }).catch(done);
    });

    after(done => {
        Subreddit.remove({}).then(() => {
            done();
        }).catch(done)
    })

    describe('POST /api/subreddits/recommended', () => {
        it('responds with 200', (done) => {
            agent.post('/api/subreddits/recommended').send({
                tags: ['tag1', 'tag2', 'tag3'],
                subscribed: ['/r/SRTest5'],
                blacklisted: ['/r/SRTest3'],
                maxRecommendations: 5
            }).expect(200, done);
        });

        it('responds with 422 if req data not sent', (done) => {
            agent.post('/api/subreddits/recommended').expect(422, done);
        });

        it('recommendation does not contain subscribed or blacklisted subreddits', (done) => {
            agent.post('/api/subreddits/recommended').send({
                tags: ['tag1', 'tag2', 'tag3'],
                subscribed: ['/r/SRTest5'],
                blacklisted: ['/r/SRTest3'],
                maxRecommendations: 5
            }).then(res => {
                var list = res.body.map(element => element.subreddit)
                    .reduce((a, b) => a.concat(b), []);
                expect(list).to.not.have.members(['/r/SRTest3', '/r/SRTest5']);
                done();
            }).catch(done);

            it('recommendation returns a list of at most maxRecommendations length', (done) => {
                agent.post('/api/subreddits/recommended').send({
                    tags: ['tag1', 'tag2', 'tag3'],
                    subscribed: ['/r/SRTest5'],
                    blacklisted: ['/r/SRTest3'],
                    maxRecommendations: 2
                }).then(res => {
                    expect(res.body.length).to.have.length(2);
                    done();
                }).catch(done);
            });
        });
    });

    describe('POST /api/subreddits/getTagsForSubreddits', () => {
        it('responds with 200', (done) => {
            agent.post('/api/subreddits/getTagsForSubreddits').send({
                subreddits: ['/r/SRTest1'],
                maxDistance: 10
            }).then(res => {
                var tags = Object.keys(res.body);
                expect(tags).to.have.members(['tag3', 'tag2']);
                done();
            }).catch(done);
        });

        it('responds with 422 if req data not sent', (done) => {
            agent.post('/api/subreddits/getTagsForSubreddits').expect(422, done);
        });

        it('returns a list of unique tags with limited max distance', (done) => {
            agent.post('/api/subreddits/getTagsForSubreddits').send({
                subreddits: ['/r/SRTest1', '/r/SRTest3', '/r/SRTest5', '/r/SRTest6'],
                maxDistance: 4
            }).then(res => {
                var tags = Object.keys(res.body);
                expect(tags).to.have.members(['tag1', 'tag2', 'tag3']);
                expect(tags).to.not.have.members(['tag5']);
                expect(tags).to.have.length(3);
                done();
            }).catch(done);
        });
    });
});
