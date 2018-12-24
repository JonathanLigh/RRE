// ---------- Globals ---------- //

const utils = require('./utils');
const config = require('../config/configuration.json');

// Sent with xhr recommendation requests
var subscribedSubreddits = [];

// ---------- Event Listeners ---------- //

window.addEventListener('message', function(event) {
    if (event.srcElement.location.host === chrome.runtime.id) {
        if (event.data.reason === "optionswrapper-closed") {
            saveTags(false, function(newTags) {
                document.getElementById('first-time-setup-tags').style.display = "none";
                window.parent.postMessage({
                    reason: "optionswrapper-closed",
                    data: newTags
                }, '*');
            });
        } else if (event.data.reason === "optionswrapper-opened-first") {
            subscribedSubreddits = event.data.data;
            initializeOptions(true);
        } else if (event.data.reason === "optionswrapper-opened") {
            initializeOptions(false);
        }
    }
});

document.getElementById("first-time-setup-tags-range").addEventListener("change", function(event) {
    var maxDistance = this.value;
    utils.xhr.getTagsForSubscriptions(subscribedSubreddits, maxDistance);
});

document.getElementById("recommendationLimit").addEventListener("keyup", function(event) {
    if (event.keyCode === 13) {
        var maxRecommendations = parseInt(document.getElementById('recommendationLimit').value);
        var status = document.getElementById('recommendation-limit-status');
        if (isNaN(maxRecommendations)) {
            status.textContent = 'Value must be integer';
        } else {
            if (maxRecommendations < 0) {
                status.textContent = 'Value must be at least 1';
            } else if (maxRecommendations > config.RRERecommendationsCacheSize - config.RRERecommendationsCacheBufferSize) {
                status.textContent = 'Value cannot exceed ' + (config.RRERecommendationsCacheSize - config.RRERecommendationsCacheBufferSize);
            } else {
                chrome.storage.sync.set({
                    RRERecommendationLimit: maxRecommendations
                }, function() {
                    document.getElementById('first-time-setup-tags').setAttribute("class", "slider");
                    status.textContent = 'Values saved';
                    setTimeout(function() {
                        status.textContent = '';
                    }, config.displayStatusMessageDuration);
                });
            }
        }
    }
});

document.getElementById("tagsInput").addEventListener("change", function(event) {
    var self = this;
    var tag = self.value;
    var added = utils.createListEntry('tags', tag, true, function() {
        document.getElementById('tags').removeChild(document.getElementById("tags-" + tag));
    });

    if (added) {
        saveTags(true, function() {
            self.value = "";
        });
    }
});

document.getElementById("blacklistInput").addEventListener("keyup", function(event) {
    if (event.keyCode === 13) {
        var blacklistInput = this;
        var subreddit = "";
        const regex = /[\w]+/g;
        var m;

        while ((m = regex.exec(this.value)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (m.index === regex.lastIndex) {
                regex.lastIndex++;
            }

            // The result can be accessed through the `m`-variable.
            var i;
            for (i in m) {
                subreddit = m[i]
            }
        }
        if (!subreddit) {
            var status = document.getElementById('blacklist-status');
            status.textContent = 'Input cannot be interpreted as subreddit';
            setTimeout(function() {
                status.textContent = '';
            }, config.displayStatusMessageDuration);
        } else {
            subreddit = "/r/" + subreddit + "/";
            utils.createListEntry('blacklist', subreddit, true, function() {
                utils.saveBlacklist(subreddit, function() {
                    document.getElementById('blacklist').removeChild(document.getElementById("blacklist-" + subreddit));
                });
            });
            utils.saveBlacklist(subreddit, function() {
                blacklistInput.value = "";
            });
        }
    }
});

// ---------- Private Functions ---------- //

// Asynchronously refresh tags dropdown and existing list items based on potentially updated server data and storage data respectively
function initializeOptions(firstTimeSetup) {
    utils.xhr.loadTags();
    chrome.storage.sync.get([
        'RRERecommendationLimit',
        'RRETags',
        'RREBlackList'
    ], function(items) {
        if (!items.RRERecommendationLimit) {
            items.RRERecommendationLimit = 5;
        }
        if (!items.RREBlackList) {
            items.RREBlackList = [];
        }
        document.getElementById('recommendationLimit').value = items.RRERecommendationLimit;

        function deleteBlacklistCallback(subreddit) {
            utils.saveBlacklist(subreddit, function() {
                document.getElementById("blacklist").removeChild(document.getElementById("blacklist-" + subreddit));
            });
        }

        var i;
        for (i in items.RREBlackList) {
            var subreddit = items.RREBlackList[i].subreddit;
            utils.createListEntry('blacklist', subreddit, false, deleteBlacklistCallback);
        }

        if (firstTimeSetup) {
            document.getElementById('first-time-setup-tags').style.display = "block";
            chrome.storage.sync.set({
                RRERecommendationLimit: items.RRERecommendationLimit,
                RREBlackList: items.RREBlackList
            });
        } else {
            function deleteTagCallback(tag) {
                document.getElementById('tags').removeChild(document.getElementById("tags-" + tag));
            }
            for (i in items.RRETags) {
                var tag = items.RRETags[i];
                utils.createListEntry('tags', tag, false, deleteTagCallback);
            }
        }
    });
}

function saveTags(clearRecommendations, callback) {
    var tags = [];
    var tagsDIV = document.getElementById('tags');

    var i;
    for (i = 0; i < tagsDIV.childElementCount; i++) {
        tags.push(tagsDIV.children[i].children[0].innerHTML);
    }

    var saveData = {
        RRETags: tags
    };

    if (clearRecommendations) {
        saveData.RRERecommendations = [];
    }

    chrome.storage.sync.set(saveData, function() {
        callback(tags);
    });
}
