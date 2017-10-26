const express = require('express');
const router = express.Router();
const models = require('../../db/models');
const Subreddit = models.Subreddit;

/*
this function finds the corresponding account object
and sets it to the requestedAccount variable on req
*/
router.param('subredditId', function(req, res, next, id) {
    Subreddit.findById(id)
        .then(subreddit => {
            req.requestedSubreddit = subreddit;
            next();
            return null; //silences a bluebird warning about promises inside of next
        })
        .catch(next);
});

router.get('/', function (req, res, next) {
  Subreddit.find({})
  .then(subreddits => res.json(subreddits))
  .catch(next);
});

router.get('/:subredditId', /*add access checking functions here*/ function (req, res, next){
  const status = (req.requestedSubreddit) ? 200 : 404;
    res.status(status).json(req.requestedSubreddit);
});


/*
Seva, I just realized we should not have a post function here,
instead we should have the crawler connect directly to the database and
create db entries as it's getting subreddit information
*/
router.post('/', /*add access checking functions here*/ function (req, res, next) {
  Subreddit.create({
    name: req.body.url,
    numSubcribers: req.body.total_subscribers,
    _relatedSubreddits:
  })
  .then(() => {
    res.status(201);
    res.json();
  })
  .catch(next);
});

router.put('/:subredditId', /*add access checking functions here*/ function (req, res, next){
  if (req.requestedSubreddit) {
    req.requestedSubreddit.update(req.body)
  .then(() => {
    res.status(202);
    res.json();
  })
  .catch(next);
} else {
  res.status(404).send('Unable to update nonexistent subreddit');
}
});

router.delete('/:subredditId', /*add access checking functions here*/ function (req, res, next) {
  if (req.requestedSubreddit) {
    req.requestedSubreddit.remove()
    .then(() => res.status(204).end())
    .catch(next);
  } else {
    res.status(404).send('Unable to delete nonexistent subreddit');
  }
});

module.exports = router;
