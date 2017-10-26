// const express = require('express');
// const router = express.Router();
// const models = require('../../db/models');
// const Relation = models.Relation;

// /*
// this function finds the corresponding account object
// and sets it to the requestedAccount variable on req
// */
// router.param('relationId', function(req, res, next, id) {
//     Relation.findById(id)
//         .then(relation => {
//             req.requestedRelation = relation;
//             next();
//             return null; //silences a bluebird warning about promises inside of next
//         })
//         .catch(next);
// });

// router.get('/', function (req, res, next) {
//   Relation.find({})
//   .then(relations => res.json(relations))
//   .catch(next);
// });

// //find relations that contain a specific subRedditId
// router.get('/relationswith/:subRedditId', function (req, res, next) {
//   Relation.find({
//     "_subreddits": {
//       "$regex": req.params.subRedditId,
//       "$options": "i" }
//     })
//   .then(relations => res.json(relations))
//   .catch(next);
// });

// router.get('/:relationId', add access checking functions here function (req, res, next){
//   const status = (req.requestedRelation) ? 200 : 404;
//     res.status(status).json(req.requestedRelation);
// });

// router.post('/', /*add access checking functions here*/ function (req, res, next) {
//   Relation.create(req.body)
//   .then(() => {
//     res.status(201);
//     res.json();
//   })
//   .catch(next);
// });

// router.put('/:relationId', /*add access checking functions here*/ function (req, res, next){
//   if (req.requestedRelation) {
//     req.requestedRelation.update(req.body)
//   .then(() => {
//     res.status(202);
//     res.json();
//   })
//   .catch(next);
// } else {
//   res.status(404).send('Unable to update nonexistent relation');
// }
// });

// router.delete('/:relationId', /*add access checking functions here*/ function (req, res, next) {
//   if (req.requestedRelation) {
//     req.requestedRelation.remove()
//     .then(() => res.status(204).end())
//     .catch(next);
//   } else {
//     res.status(404).send('Unable to delete nonexistent relation');
//   }
// });

// module.exports = router;
