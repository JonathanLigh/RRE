const mongoose = require('mongoose');
const chalk = require('chalk');
const Subreddit = require('./index').Subreddit;


//note to future self: use a sigmoid on the entirety of the weights
//takes an array of objectid references of subreddits
const genCorrelationValue = (collection) => {
  let subreddits = getSubredditsFromIds(collection);
  return calcCorrelation(subreddits);

}

const getSubredditsFromIds = (subreddit_ids) => {
  let tempCollection = [];
  return Promise.all(subreddit_ids.map((id) => {
    return Subreddit.findOne({_id: id})
  }))
  .then(subreddits => {
    tempCollection = subreddits;
    return subreddits;
  })
  .catch(err => {
    console.error(chalk.red(err));
    process.exit(1);
  });
};

const calcCorrelation = (subreddits) => {
  let correlation = 0; //degree correlation
  let similarities = subreddits[0].tags; //common keywords shared between every subreddit in the list, initialize with the tags from the first subreddit.
  for (let i = 0; i < subreddits.length; i++) {
    similarities.filter(elements => subreddits[i].tags.includes(elements)); //filters elements in similarities by elements also in the second array

    correlation -=subreddits[i].tags.length;
  };

  correlation += similarities.length * subreddits.length;
  return correlation;
};




module.exports = {
  genCorrelationValue: genCorrelationValue
};
