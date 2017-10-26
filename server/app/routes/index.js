// 'use strict';

const router = require('express').Router();
module.exports = router;

// router.use('/relations', require('./relations'));
router.use('/subreddits', require('./subreddits'));
router.use('/tags', require('./tags'));

router.use(function(req, res) {
  res.status(404).end();
});
