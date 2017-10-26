//this model quantifies the relationship between collections of subreddits and rates them;
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const tagSchema = new Schema({
  name: {type: String, required: true, unique: true}
});

tagSchema.query.getTagById = (id) => {
  return this.find({_id: id})
}

module.exports = mongoose.model('Tag', tagSchema);
