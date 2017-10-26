const express = require('express');
const router = express.Router();
const models = require('../../db/models');
const Subreddit = models.Subreddit;

/*
returns the top 5 recommended subreddits
  The req body will have:
    a list of subscribed subreddits
    a list of blacklisted subreddits (unwanted)
  The res body will have:
    a list of the top 5 recommended
*/
router.get('/recommended', function (req, res, next) {

  Subreddit.find({})
  .then(subreddits => res.json(subreddits))
  .catch(next);
});


module.exports = router;
