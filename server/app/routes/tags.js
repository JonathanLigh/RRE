const express = require('express');
const router = express.Router();
const models = require('../../db/models');
const Tag = models.Tag;

router.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// responds with all tags in the database
// we will need to be able to serve this up to users so they can add existing
// tags to their prefered tags.
router.get('/', function(req, res, next) {
    Tag.find({}).exec().then(tags => {
        // sets the status of the response to sucessful and sends the tags
        res.status(200).json(tags);
    }).catch(next);
});

module.exports = router;
