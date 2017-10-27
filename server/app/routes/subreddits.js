const express = require('express');
const router = express.Router();
const models = require('../../db/models');
const async = require('async');
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

  // if we recieve the
  Subreddit.getTagsBySubreddit(req.body.subreddits)
  .exec()
  .then(tags => {
    print("tags after getting them from every Subreddit: " + tags);
    return tags = tags.reduce((a, b) => a.concat(b), []);
  }).then(tags => {
    tags = tags.concat(req.body.tags);
    print("tags after concating them with req.body.tags: " + tags);
    return Subreddit.getSubredditsByTags(req.body.blacklist, tags);
  }).then(recSubreddits => {
    res.status(200);
    res.json(recSubreddits);
  })
  .catch(next);
});


module.exports = router;
