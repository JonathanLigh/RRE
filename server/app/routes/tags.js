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

router.get('/', function (req, res, next) {
  Tag.find({}).exec()
  .then(tags => res.json(tags))
  .catch(next);
});

router.get('/byName/:tagName', function (req, res, next) {
  Tag.findOne({
    name: req.tagName
  }).exec()
  .then(tag => res.json(tag))
  .catch(next);
})

router.get('/:tagId', /*add access checking functions here*/ function (req, res, next){
  const status = (req.requestedTag) ? 200 : 404;
    res.status(status).json(req.requestedTag);
});

router.post('/', /*add access checking functions here*/ function (req, res, next) {
  Tag.create(req.body)
  .then(() => {
    res.status(201);
    res.json();
  })
  .catch(next);
});

router.put('/:tagId', /*add access checking functions here*/ function (req, res, next){
  if (req.requestedTag) {
    req.requestedTag.update(req.body)
  .then(() => {
    res.status(202);
    res.json();
  })
  .catch(next);
} else {
  res.status(404).send('Unable to update nonexistent tag');
}
});

router.delete('/:tagId', /*add access checking functions here*/ function (req, res, next) {
  if (req.requestedTag) {
    req.requestedTag.remove()
    .then(() => res.status(204).end())
    .catch(next);
  } else {
    res.status(404).send('Unable to delete nonexistent tag');
  }
});

module.exports = router;
