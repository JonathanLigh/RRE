const models = require('../../db/models');
const Subreddit = models.Subreddit;

// all constants below are arbitrary rn
const initialIntegralConst = 25.0;
const integralLinearReductionConst = 9.0;
const functionallyIrrelevantDistance = 100;

function matchArrayLengths(array1, array2) {
    var smallerArray = array1.length > array2.length ? array2 : array1
    var i;
    for (i = 0; i < Math.abs(array1.length - array2.length); i++) {
        smallerArray.push(functionallyIrrelevantDistance);
    }
}

/**
 * Returns array where each index is number of tags used and value is the sum of distances
 **/
function tagsIntegral(tags) {
    // number will always be less than or equal to tags.length
    var result = [];
    var integral = 0;
    var i;
    for (i in tags) {
        if (tags[i].distance < functionallyIrrelevantDistance) {
            integral += tags[i].distance;
            result.push(integral);
        } else {
            break;
        }
    }
    return result;
}

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
        matchingTags.sort(function(a, b) {
            // decending order (lowest distances first)
            return a.distance - b.distance
        });
        return matchingTags;
    },
    calculateIntegralScore: function(subreddit1Tags, subreddit2Tags) {
        var integrals1 = tagsIntegral(subreddit1Tags);
        var integrals2 = tagsIntegral(subreddit2Tags);
        var integralScore = 0;
        matchArrayLengths(integrals1, integrals2);
        var integralConst = initialIntegralConst;
        var i;
        for (i in integrals1) {
            integralScore += (integrals1[i] - integrals2[i]) * integralConst;
            integralConst /= integralLinearReductionConst;
        }
        // console.log("s1: " + integrals1 + " " + "s2: " + integrals2 + " " + "Score: " + integralScore);
        // a [0,3,10] => [0,3,13]
        // b [1,1,6] => [1,2,8]
        // [c=c/2, starts at 10] -10 -> -5 -> 7.5 (b)

        // a [10, 29, 29] => [10, 39, 68]
        // b [9] => [9, 39, 69]
        // 10 -> 10 -> 7.5 (b)
        return integralScore;
    }
}
