const chai = require('chai');
const spies = require('chai-spies');
chai.use(spies);
const expect = chai.expect;

const models = require('../../db/models');
const User = models.User;

describe('Subreddit Model', () => {
  describe('Virtuals', () => {
    describe('fullName', () => {
      let user;
      // Before Each Test
      beforeEach(() => {
        // Since we are testing virtuals, we do not need to upload into database to test. Instead, the model constructor is sufficient.
        subreddit = new Subreddit({
          firstName: 'Jason',
          lastName: 'Jonathan',
          email: 'projectsecuroserv@hotmail.com',
          username: 'moohab'
        });
      });
      // Test Case
      it('returns the firstName and lastName combined by a space', () => {
        expect(user.fullName).to.be.equal('Jason Jonathan');
      });
    });

  });
});
