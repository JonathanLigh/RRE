'use strict';
const chalk = require('chalk');
/**
 * Helper function to split string of words into collection of words
 * @param {string} sample - a string with multiple words, and some common punctuation
 */
function getWordsFromSample (sample) {
    return  sample.match(/\w+|\s+|[^\s\w]+.?!`~/g)
        .filter( word => word !== '\n')
        .filter( word => word !== ' ')
        .filter( word => word !== ' \n ')
        .map(word => word.toLowerCase());
}

/**
 * Function to build a filter model of words and frequency
 * @param {string[]} samples - collection of words to add to the filter
 * @param {{name: {string} - count: {int}[]} - wordFilter teachable filter model object
 * @return teachable filter object
 *
 * Module Usage:
 * 1. Start with an initial collection of samples and an empty array(filter)
 * 2. Feed samples and filter into teachFilter.
 * 3. Assign output of teachFilter to filter
 * 4. If there are more samples, add more samples, and the existing filter Model as input
 * 5. When filter is sufficiently taught, run generateFilterList with a chosen threshold of occurances.
 * 6. Save output as a list of words which are the words to be filtered.
 * 7. Use the taught model to filter phrases with filterWords
 */
function teachFilter (samples, wordFilter = []) {
    // Using linear for loop to avoid javascript foreach performance issues
    for(var a = 0; a < samples.length; a++) {
        //split into words and punctuation
        var words = getWordsFromSample(samples[a]);
        for(var b = 0; b < words.length; b++)   {
           var index = wordFilter.map( fword => fword.name ).indexOf(words[b].toLowerCase());
           if (index != -1) {
               wordFilter[index].count++;
           }
           else {
               wordFilter.push({name: words[b].toLowerCase(), count: 1});
           }
        }
    }
    return wordFilter;
}

/**
 * Turns filter object into a list of filtered words
 * @param wordFilter - teachable filter object
 * @param {int} threshold - threshold of occurences to be a part of the filter, inclusive
 * @return {string[]} list of word to be used as a filter
 */
function generateFilterList (wordFilter, threshold) {
    return  wordFilter.filter(word => word.count >= threshold).map( word => word.name);
}

/**
 * Filters list of words with a filterList
 * @param {string[]} list of lowercase words to be filtered.
 * @param {string[]} generated filterList of words to remove
 * @return {string[]} words that have been filtered
 */
function filterWords (words, filterList) {
    return  words.filter( word => !filterList.includes(word));
}

module.exports = {

    getWordsFromSample: function (sample) {
        return getWordsFromSample(sample);
    },

    teachFilter: function (samples, wordFilter = [])  {
        return teachFilter(samples, wordFilter);
    },

    generateFilterList: function (wordFilter, threshold) {
        return generateFilterList(wordFilter, threshold);
    },

    filterWords: function (words, filterList) {
        return filterWords(words, filterList);
    }
}
