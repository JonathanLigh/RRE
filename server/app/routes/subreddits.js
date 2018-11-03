const express = require('express');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const router = express.Router();
const models = require('../../db/models');
const async = require('async');
const Subreddit = models.Subreddit;
const Relation = models.Relation;
const Tag = models.Tag;
const TagRelation = models.TagRelation;
const chalk = require('chalk');
const Heap = require('heap');
const ProgressBar = require('console-progress');
const routeUtils = require('./utils.js');

router.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

router.post('/search', function(req, res, next) {
    // search reddits, then search reddits through tags and tagrelations
    // response list
    var list = [];
    if(!!req.body.query) {
        var query = req.body.query.split(" ");
        Subreddit.findAll({
            limit: 100,
            where: {
                url: {
                    [Op.in]: query
                }
            },
            Order: Sequelize.col('numSubscribers')
        }).then(results => {
            // the results of the first query become the list
            list = results;
            return Subreddit.findAll({
                limit: 100,
                include: [{
                    model: Tag,
                    where: {
                        name: {
                            [Op.in]: query
                        }
                    }
                }],
                Order: Sequelize.col('numSubscribers')
            })
        }).then(results => {
            results.forEach(subreddit => {
                list.push(subreddit);
            });
            res.status(200).json(list);
        }).catch(next);
    } else {
        res.status(422).send('Unprocessable Entity')
    }
})

/*
returns all unique tags of provided subreddits that are within the provided distance
  The req body will have:
    a list of subreddits
    maximum tag distance
  The res body will have:
    a map of tags and their distances
*/

router.post('/getTagsFromSubscribedSubreddits', function(req, res, next) {
    if (!!req.body.subscribed && !!req.body.maxDistance) {

        Tag.findAll({
            limit: 200,
            include: [{
                model: Subreddit,
                where: {
                    url: {
                        [Op.in]: req.body.subscribed
                    }
                }
            }]
        }).then(response => {
            res.status(200).json(response);
        }).catch(next);
    } else {
        res.status(422).send('Unprocessable Entity');
    }
});

/*
returns the top (n) recommended subreddits
  The req body will have:
    number of recommendations to return (n)
    a list of tags
    a list of subscribed subreddits
    a list of blacklisted subreddits (unwanted)
  The res body will have:
    a list of the top (n) recommended, in order of relevancy
*/

router.post('/recommended', function(req, res, next) {
    if (!!req.body.subscribed && !!req.body.maxRecommendations && !!req.body.tags && !!req.body.blacklist) {

        // define heap with which we rank
        var heap = new Heap(function(subreddit1, subreddit2) {

            if (subreddit1.relatedSubreddits !== undefined && subreddit2.relatedSubreddits !== undefined) {
                // the more related subreddits to this suggestion, the better
                return subreddit1.relatedSubreddits.length - subreddit2.relatedSubreddits.length;
            } else if (subreddit1.relatedSubreddits !== undefined && subreddit2.relatedSubreddits === undefined) {
                return 1;
            } else if (subreddit1.relatedSubreddits === undefined && subreddit2.relatedSubreddits !== undefined){
                return -1;
            } else {
                // more related tags the better
                return subreddit1.tags.length - subreddit2.tags.length;
            }
        });

        // returns all subreddits related to the subscribed subreddits
        var subreddits = [];
        return Subreddit.findAll({
            where: {
                url: {
                    [Op.and]: {
                        [Op.notIn]: req.body.subscribed,
                        [Op.notIn]: req.body.blacklist
                    }
                }
            },
            include: [{
                model: Subreddit,
                as: 'relatedSubreddits',
                where: {
                    url: {
                        [Op.and]: {
                            [Op.in]: req.body.subscribed,
                            [Op.notIn]: req.body.blacklist
                        }
                    }
                }
            }]
        }).then(results => {
            subreddits = results;
            return Subreddit.findAll({
                where: {
                    url: {
                        [Op.and]:{
                            [Op.notIn]: req.body.blacklist,
                            [Op.notIn]: req.body.subscribed
                        }
                    }
                },
                include: [{
                    model: Tag,
                    where: {
                        name: {
                            [Op.in]: req.body.tags
                        }
                    }
                }]
            })
        }).then(results => {

            results.forEach(subreddit => {
                if (!subreddits.includes(subreddit)) {
                    subreddits.push(subreddit);
                }
            })

            subreddits.forEach(subreddit => {
                if (heap.size() >= req.body.maxRecommendations) {
                    heap.pushpop(subreddit);
                } else {
                    heap.push(subreddit);
                }
            });

            var output = [];

            // push the top of the heap into output
            var i = 0
            while(!heap.empty() && i < req.body.maxRecommendations){
                output.push(heap.pop());
                i++;
            }


            res.status(200).json(output);
        }).catch(next);
    } else {
        res.status(422).send("Unprocessable Entity");
    }
});

module.exports = router;
