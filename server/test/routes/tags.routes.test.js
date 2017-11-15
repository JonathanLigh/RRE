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
const Tag = models.Tag;
const utils = require('../utils');

const tags = [{
  name: 'tag1'
}, {
  name: 'tag2'
}, {
  name: 'tag3'
}, {
  name: 'tag4'
}]

describe('Tag Routes', () => {

  // Before Each Test
  before(done => {
      Tag.insertMany(tags)
      .then(() => {
          done();
      }).catch(done);
  });

  after(done => {
      Tag.remove({})
      .then(() => {
          done();
      }).catch(done)
  })

  describe('GET /api/tags', () => {
      it('responds with 200', (done) => {
          agent
          .get('/api/tags')
          .expect(200, done);
      });

      it('responds with tags in the database', (done) => {
          agent
          .get('/api/tags')
          .then(res => {
            expect(res.body).to.exist;
            expect(res.body.length).to.equal(4);

            done();
          })
          .catch(done);
      });
  });
});
