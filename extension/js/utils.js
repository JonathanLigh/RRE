// ---------- Globals ---------- //

const config = require('../config/configuration.json');

// Fallback if server is offline when making call to the loadTags function
var loadTagsTimeout;

// ---------- Public Functions ---------- //

function saveBlacklist(subreddit, callback) {
    chrome.storage.sync.get([
        'RREBlackList',
        'RRERecommendations'
    ], function(items) {
        var doDelete = true;
        var blacklist = items.RREBlackList;
        var recommendations = items.RRERecommendations;
        var i;
        for (i = 0; i < blacklist.length; i++) {
            if (blacklist[i].subreddit === subreddit) {
                // If this is true then we are deleting the entry, not adding it
                if (blacklist[i].rank !== -1) {
                    recommendations.splice(blacklist[i].rank, 0, blacklist[i]);
                }
                blacklist.splice(i, 1);
                doDelete = false;
                break;
            }
        }

        if (doDelete) {
            var newBlacklistEntry = {
                subreddit: subreddit,
                rank: -1
            }

            var recommendations = items.RRERecommendations;
            for (i = 0; i < recommendations.length; i++) {
                if (recommendations[i].subreddit === newBlacklistEntry.subreddit) {
                    newBlacklistEntry.rank = i;
                    break;
                }
            }
            if (newBlacklistEntry.rank > -1) {
                recommendations.splice(newBlacklistEntry.rank, 1);
            }

            blacklist.push(newBlacklistEntry);
        }

        chrome.storage.sync.set({
            RREBlackList: blacklist,
            RRERecommendations: recommendations
        }, function() {
            if (callback) {
                callback();
            }
        });
    });
}

function createListEntry(parentID, value, displayStatus, deleteCallback) {
    var parentDIV = document.getElementById(parentID);

    for (var i = 0; i < parentDIV.childElementCount; i++) {
        var existingValue = parentDIV.children[i].children[0].innerHTML;
        if (existingValue === value) {
            if (displayStatus) {
                var status = document.getElementById(parentID + "-status");
                status.textContent = 'Entry already exists';
                setTimeout(function() {
                    status.textContent = '';
                }, 1000);
            }
            return false;
        }
    }

    var id = parentID + "-" + value;

    var entry = document.createElement("div");
    entry.setAttribute("id", id);
    entry.style.display = "block";

    var valueDIV = document.createElement("div");
    valueDIV.innerHTML = value;
    valueDIV.style.display = "inline";
    entry.appendChild(valueDIV);

    if (parentID === "recommendations") {
        entry.setAttribute("class", "recommendation");
        valueDIV.addEventListener('click', function() {
            window.location.pathname = value;
        });
    }

    var deleteButton = document.createElement("button");
    deleteButton.setAttribute("class", "deleteButton");
    // deleteButton.setAttribute("id", parentID + "-delete-" + value);
    deleteButton.innerHTML = '&times;';
    deleteButton.addEventListener('click', function() {
        deleteCallback(value);
    });
    entry.appendChild(deleteButton);
    parentDIV.appendChild(entry);
    return true;
}

function setListEntryMessage(parentID, message, image) {
    var existingMessage = getListEntryMessage(parentID);
    if (existingMessage) {
        // delete message if message is undefined or change otherwise
        if (message) {
            existingMessage.firstElementChild.innerHTML = message;
        } else if (image) {
            existingMessage.lastElementChild.src = image;
        } else {
            var parentDIV = document.getElementById(parentID);
            parentDIV.removeChild(existingMessage);
        }
    } else if (message || image) {
        // create and insert
        var parentDIV = document.getElementById(parentID);
        var id = parentID + "-message";

        var entry = document.createElement("div");
        entry.setAttribute("id", id);
        entry.style.display = "block";

        if (message) {
            var valueDIV = document.createElement("div");
            valueDIV.innerHTML = message;
            valueDIV.style.display = "inline";
            entry.appendChild(valueDIV);
        }

        if (image) {
            var imageDIV = document.createElement("img");
            imageDIV.src = image;
            imageDIV.style.display = "inline";
            imageDIV.style.height = "20px";
            entry.appendChild(imageDIV);
        }

        entry.className = "entry-message";

        if (parentID === "recommendations") {
            entry.className += " entry-message-recommendation";
        }

        parentDIV.appendChild(entry);
    }
}

function getListEntryMessage(parentID) {
    var parentDIV = document.getElementById(parentID);
    var id = parentID + "-message";

    for (var i = 0; i < parentDIV.childElementCount; i++) {
        var entryDIV = parentDIV.children[i];
        if (entryDIV.id === id) {
            return entryDIV;
        }
    }
}

function initializeSubscribedSubreddits(callback) {
    var subscribedSubreddits = [];
    var srList = document.getElementsByClassName("sr-list");
    var resLayout = false;
    if (srList.length !== 0) {
        // Standard Reddit Layout
        srList = srList[0].children[2];
    } else {
        // RES Layout
        resLayout = true;
        srList = document.getElementById("srList").lastElementChild;
        if (!srList) {
            // Fallback if subreddit table hasn't loaded yet
            function srListListener(event) {
                if (event.target.parentElement.id === "srList" && event.target.nodeName === "TBODY") {
                    var srListContainer = document.getElementById("srDropdownContainer");
                    if (srListContainer) {
                        document.removeEventListener("DOMNodeInserted", srListListener);
                        srListContainer.click();
                    }
                    initializeSubscribedSubreddits(callback);
                }
            }
            var srListContainer = document.getElementById("srDropdownContainer");
            document.addEventListener("DOMNodeInserted", srListListener);
            srListContainer.click();
            return;
        }
    }
    if (srList) {
        for (var i = 0; i < srList.childElementCount; i++) {
            subscribedSubreddits.push(extractSubscribedSubreddit(srList.children[i], resLayout));
        }
    }
    callback(subscribedSubreddits);
}

function extractSubscribedSubreddit(subredditDIV, resLayout) {
    var subredditName;
    if (resLayout) {
        subredditName = subredditDIV.firstElementChild.lastElementChild.innerHTML;
    } else {
        subredditName = subredditDIV.lastElementChild.innerHTML;
    };
    subredditName = "/r/" + subredditName + "/";
    return subredditName.toLowerCase();
}

function loadRecommendations(seedData, subscribedSubreddits, showLoadingDIV, callback) {
    var self = this;
    if (!self.loadingNewRecommendations) {
        self.loadingNewRecommendations = true;

        if (showLoadingDIV) {
            // Show loading animation
            document.getElementById('recommendations-loading').style.display = "block";
            document.getElementById('recommendations').style.display = "none";
        }

        // Hide loading animation
        function hideLoadingDIV() {
            document.getElementById('recommendations').style.display = "";
            document.getElementById('recommendations-loading').style.display = "none";
        }

        var xhr = new XMLHttpRequest();
        xhr.open('POST', config.RREServerURL + '/api/subreddits/recommended');
        xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

        xhr.onload = function() {
            if (this.status === 200) {
                var response = JSON.parse(this.response);

                chrome.storage.sync.set({
                    RRERecommendations: response
                }, function() {
                    self.loadingNewRecommendations = false;
                    if (showLoadingDIV) {
                        hideLoadingDIV();
                    }
                    callback(response);
                });
            } else {
                alert("RRE Server Error: " + this.status);
            }
        };

        // Retry the request every 30 minutes while webpage is open
        xhr.onerror = function(error) {
            if (showLoadingDIV) {
                hideLoadingDIV();
            }
            callback(undefined);
        };

        xhr.send(JSON.stringify({
            tags: seedData.RRETags,
            subscribed: subscribedSubreddits,
            blacklisted: seedData.RREBlackList,
            maxRecommendations: config.RRERecommendationsCacheSize
        }));
    }
}

function loadTags() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', config.RREServerURL + '/api/tags/', true);

    xhr.onload = function() {
        if (this.status === 200) {
            if (loadTagsTimeout) {
                clearTimeout(loadTagsTimeout);
                loadTagsTimeout = undefined;
            }
            var tagsInput = document.getElementById('tagsInput');

            // Clear out existing tag options (if any)
            while (tagsInput.childElementCount > 0) {
                tagsInput.removeChild(tagsInput.firstElementChild);
            }

            // Replace with tags from response
            var response = JSON.parse(this.response);
            var i;
            for (i in response) {
                var option = document.createElement("option");
                option.text = response[i].name;
                tagsInput.add(option);
            }
        }
    };

    // Retry the request every 30 minutes while webpage is open
    xhr.onerror = function(error) {
        loadTagsTimeout = setTimeout(function() {
            loadTags();
        }, config.retryRequestToServerTimeoutDuration);
    };

    xhr.send();
}

function getTagsForSubscriptions(subscribedSubreddits, maxDistance) {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', config.RREServerURL + '/api/subreddits/getTagsForSubreddits');
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

    xhr.onload = function() {
        if (this.status === 200) {
            var response = JSON.parse(this.response);
            var totalTags = Object.keys(response).length;
            var tagListDIV = document.getElementById('tags');

            // Clear any potential status notifications
            setListEntryMessage('tags');

            // Clear list if it has more tags than give (this can be optimized)
            // We dont have to clear list if it has less tags because createListEntry prevents duplicates
            if (tagListDIV.childElementCount > totalTags) {
                while (!!tagListDIV.firstChild) {
                    tagListDIV.removeChild(tagListDIV.firstChild);
                }
            }

            function deleteCallback(tag) {
                tagListDIV.removeChild(document.getElementById("tags-" + tag));
            }

            var tag;
            for (tag in response) {
                createListEntry('tags', tag, false, deleteCallback);
            }
        }
    }

    xhr.onerror = function(error) {
        setListEntryMessage('tags');
        setListEntryMessage('tags', "RRE Server appears to be offline...<br>Wait a bit before trying again");
    };

    xhr.send(JSON.stringify({
        subreddits: subscribedSubreddits,
        maxDistance: maxDistance
    }));
}

module.exports = {
    saveBlacklist: saveBlacklist,
    createListEntry: createListEntry,
    setListEntryMessage: setListEntryMessage,
    getListEntryMessage: getListEntryMessage,
    initializeSubscribedSubreddits: initializeSubscribedSubreddits,
    xhr: {
        loadingNewRecommendations: false,
        loadRecommendations: loadRecommendations,
        loadTags: loadTags,
        getTagsForSubscriptions: getTagsForSubscriptions
    }
}
