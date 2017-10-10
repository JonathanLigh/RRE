const express = require('express');
const router = express.Router();
const models = require('../../db/models');
const Tag = models.Tag;

/*
this function finds the corresponding account object
and sets it to the requestedAccount variable on req
*/
router.param('tagId', function(req, res, next, id) {
    Tag.findById(id)
        .then(tag => {
            req.requeste Tag = tag;
            next();
            return null; //silences a bluebird warning about promises inside of next
        })
        .catch(next);
});

router.get('/', function (req, res, next) {
  Tag.findAll()
  .then(tags => res.json(tags))
  .catch(next);
});

router.get('/:tagId', /*add access checking functions here*/ function (req, res, next){
  const status = (req.requeste Tag) ? 200 : 404;
    res.status(status).json(req.requeste Tag);
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
  if (req.requeste Tag) {
    req.requeste Tag.update(req.body)
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
  if (req.requeste Tag) {
    req.requeste Tag.remove()
    .then(() => res.status(204).end())
    .catch(next);
  } else {
    res.status(404).send('Unable to delete nonexistent tag');
  }
});

module.exports = router;
