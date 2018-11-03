'use strict'
/*
The purpose of this file is to contain useful methods for interacting with
reddit's api. Most of the methods here might not stay here by the end of
developement.
*/
var snoowrap = require('snoowrap');

/*
This from this object is where we will be making all of our requests to
reddit services. Consult the documentation for how to interface with this
object:
https://not-an-aardvark.github.io/snoowrap/#toc4__anchor,
https://www.reddit.com/dev/api/
*/
const rAPI = new snoowrap({
  userAgent: process.env.USER_AGENT,
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  username: process.env.REDDIT_USERNAME,
  password: process.env.REDDIT_PASS
});

const CrawlerAPI = new snoowrap({
  userAgent: process.env.CRAWLERUSER_AGENT,
  clientId: process.env.CRAWLERCLIENT_ID,
  clientSecret: process.env.CRAWLERCLIENT_SECRET,
  username: process.env.REDDIT_USERNAME,
  password: process.env.REDDIT_PASS
});

module.exports = {
  redditAPI: rAPI,
  CrawlerAPI: CrawlerAPI
}
