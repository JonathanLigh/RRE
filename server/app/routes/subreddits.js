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
  Subreddit.findAll()
  .then(subreddits => res.json(subreddits))
  .catch(next);
});

router.get('/:subredditId', /*add access checking functions here*/ function (req, res, next){
  const status = (req.requestedSubreddit) ? 200 : 404;
    res.status(status).json(req.requestedSubreddit);
});

router.post('/', /*add access checking functions here*/ function (req, res, next) {
  Subreddit.create(req.body)
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
