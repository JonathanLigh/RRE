const express = require('express');
const router = express.Router();
const models = require('../../db/models');
const Tag = models.Tag;

/*
this function finds the corresponding account object
and sets it to the requestedAccount variable on req
*/
router.param('tagId', function(req, res, next, id) {
    Tag.findOne({_id: id}).exec()
        .then(tag => {
            req.requestedTag = tag;
            next();
            return null; //silences a bluebird warning about promises inside of next
        })
        .catch(next);
});

// responds with all tags in the database
// we will need to be able to serve this up to users so they can add existing
// tags to their prefered tags.
router.get('/', function (req, res, next) {
  Tag.find({}).exec()
  .then(tags => {
    // sets the status of the response to sucessful and sends the tags
    res.status(200).json(tags);
  })
  .catch(next);
});

router.get('/name/:tagName', function (req, res, next) {
  Tag.findOne({
    name: req.params.tagName
  }).exec()
  .then(tag => res.json(tag))
  .catch(next);
})

router.get('/:tagId', /*add access checking functions here*/ function (req, res, next){
  const status = (req.requestedTag) ? 200 : 404;
    res.status(status).json(req.requestedTag);
});

module.exports = router;
