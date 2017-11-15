const models = require('../../db/models');
const Subreddit = models.Subreddit;

module.exports = {
  getMatchingTags: function(tags, searchTags) {
      var matchingTags = [];
      var i;
      for (i in tags) {
          var tag = tags[i];
          if (searchTags.indexOf(tag.name) !== -1) {
              matchingTags.push(tag);
          }
          if (matchingTags.length === searchTags.length) {
              return matchingTags;
          }
      }
      return matchingTags;
  },
  getMentionDistanceSum: function (tags) {
      var sum = 0;
      var i;
      for (i in tags) {
          sum += tags[i].distance;
      }
      return sum;
  },
  getMinMentionDistance: function (tags) {
      var min = Number.MAX_VALUE;
      var i;
      for (i in tags) {
          if (min > tags[i].distance) {
              min = tags[i].distance;
          }
      }
      return min;
  }
}
