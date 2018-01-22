// ---------- Globals ---------- //

const utils = require('./utils');
const config = require('../config/configuration.json');

// Used to prevent multiple identical requests to server if user triggers suggestion refresh.
// Set to true before send and set to false inside the onload.
var loadingNewRecommendations = false;

// Used to trigger dynamic refresh if settings are modified.
// Set to current state of settings before when settings wondow opened and compared with settings after settings window is closed.
var oldSettings = {};

// Used to ensure the settings modal will close even if a message isnt recieved after a timeout period.
var closeModalTimeout;

// Fallback if server is offline when making call to the loadRecommendations function
var loadRecommendationsTimeout;

// Sent with xhr recommendation requests
var subscribedSubreddits = [];

// ---------- Page Load Execution ---------- //

// Get the page element extension will attach to
var sideBarDiv = document.getElementsByClassName("side")[0];

// Assert that we have the container to attach to
if (sideBarDiv) {
    // Setup the container
    var RREContainer = document.createElement("div");
    RREContainer.setAttribute('class', 'spacer');
    var loadingGifURL = chrome.runtime.getURL('./img/loading.gif');
    var optionshtml = chrome.runtime.getURL('./html/options.html');

    RREContainer.innerHTML =
        `<div>
            <div>
                <div style="display:inline; font-size:16px; font-weight:bold;">Recommendations:</div>
                <button id="settings-button" style="position:relative; left: 28%">Settings</button>
            </div>
            <lu id=recommendations>
            </lu>
            <img id="recommendations-loading" style="display:none; max-height:100px;" src="${loadingGifURL}">
            <div id="optionswrapper" class="optionswrapper">
                <div class="optionswrapper-content">
                    <div class="title">RRE Settings</div>
                    <span id="close-optionswrapper" class="close">&times;</span>
                    <iframe id="optionswrapper-frame" class="optionswrapper-frame" align="left" src="${optionshtml}">
                    </iframe>
                </div>
            </div>
        </div>`;

    // Inject into reddit sidebar
    sideBarDiv.insertBefore(RREContainer, sideBarDiv.childNodes[1]);

    // First time initialization of recommendations on page load
    refreshRecommendations(false, false);

    // initialization of event listeners on page load
    initializeEventListeners();
}

// ---------- Event Listeners ---------- //

function initializeEventListeners() {
    document.getElementById('settings-button').addEventListener('click', function() {
        var frame = document.getElementById('optionswrapper-frame');
        frame.contentWindow.postMessage({
            reason: "optionswrapper-opened"
        }, '*');
        chrome.storage.sync.get([
            'RRERecommendationLimit',
            'RREBlackList',
            'RRETags'
        ], function(items) {
            oldSettings = items;
            document.getElementById('optionswrapper').style.display = "block";
        });
    });

    // When the user clicks on <span> (x), close the modal
    document.getElementById("close-optionswrapper").onclick = function() {
        var frame = document.getElementById('optionswrapper-frame');
        frame.contentWindow.postMessage({
            reason: "optionswrapper-closed"
        }, '*');
        closeModalTimeout = setTimeout(function() {
            closeModalAndUpdateRecommendations();
        }, config.closeModalTimeoutDuration);
    }

    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function(event) {
        if (event.target == document.getElementById("optionswrapper")) {
            var frame = document.getElementById('optionswrapper-frame');
            frame.contentWindow.postMessage({
                reason: "optionswrapper-closed"
            }, '*');
            closeModalTimeout = setTimeout(function() {
                closeModalAndUpdateRecommendations();
            }, config.closeModalTimeoutDuration);
        }
    }

    window.addEventListener('message', function(event) {
        if (chrome.runtime.getURL("/").indexOf(event.origin) !== -1) {
            if (event.data.reason === "optionswrapper-closed") {
                // Stop the backup modal close funtion since we received a message to close it.
                clearTimeout(closeModalTimeout);
                // Immediately close the modal.
                closeModalAndUpdateRecommendations(event.data.data);
            }
        }
    });
}

// ---------- Private Functions ---------- //

function closeModalAndUpdateRecommendations(newTags) {
    document.getElementById('optionswrapper').style.display = "none";
    if (newTags) {
        if (!oldSettings.RRETags || oldSettings.RRETags.length !== newTags.length) {
            refreshRecommendations(true, true);
            oldSettings = {};
            return;
        } else {
            for (i = 0; i < oldSettings.RRETags.length; i++) {
                if (oldSettings.RRETags[i] !== newTags[i]) {
                    refreshRecommendations(true, true);
                    oldSettings = {};
                    return;
                }
            }
        }
    }
    chrome.storage.sync.get([
        'RRERecommendationLimit',
        'RREBlackList',
    ], function(items) {
        if (!oldSettings.RRERecommendationLimit || oldSettings.RRERecommendationLimit !== items.RRERecommendationLimit) {
            refreshRecommendations(true, false);
            oldSettings = {};
            return;
        }
        // If blacklist modified, refresh recommendations
        if (!oldSettings.RREBlackList || oldSettings.RREBlackList.length !== items.RREBlackList.length) {
            refreshRecommendations(true, false);
            oldSettings = {};
            return;
        } else {
            for (i = 0; i < oldSettings.RREBlackList.length; i++) {
                if (oldSettings.RREBlackList[i].subreddit !== items.RREBlackList[i].subreddit) {
                    refreshRecommendations(true, false);
                    oldSettings = {};
                    return;
                }
            }
        }
    });
}

function refreshRecommendations(deletedRecommendation, forceRefresh) {
    var clearAll = typeof deletedRecommendation === 'boolean' && deletedRecommendation;

    function clearRecommendations(clearAll, deletedRecommendation) {
        var recommendationsListDIV = document.getElementById('recommendations');
        if (clearAll) {
            while (!!recommendationsListDIV.firstElementChild) {
                recommendationsListDIV.removeChild(recommendationsListDIV.firstElementChild);
            }
        } else if (deletedRecommendation && recommendationsListDIV.contains(deletedRecommendation)) {
            recommendationsListDIV.removeChild(deletedRecommendation);
        }
    }

    function processRecommendations(recommendations, entryMessage, entryImage) {
        if (recommendations) {
            if (loadRecommendationsTimeout) {
                clearTimeout(loadRecommendationsTimeout);
                loadRecommendationsTimeout = undefined;
            }
            clearRecommendations(clearAll, deletedRecommendation);
            populateRecommendations(recommendations);
        } else {
            utils.setListEntryMessage("recommendations");
            utils.setListEntryMessage(
                "recommendations",
                entryMessage,
                entryImage
            );

            loadRecommendationsTimeout = setTimeout(function() {
                utils.xhr.loadRecommendations(seedData, subscribedSubreddits, false, processRecommendations);
            }, config.retryRequestToServerTimeoutDuration);
        }
    }

    chrome.storage.sync.get([
        'RRERecommendationLimit',
        'RRETags',
        'RREBlackList'
    ], function(seedData) {
        // Do we have seed data?
        if (!seedData.RRETags || !seedData.RREBlackList || !seedData.RRERecommendationLimit) {
            // No seed data, first time setup.
            // Extract user subscriptions from reddit DOM
            utils.initializeSubscribedSubreddits(function(extractedSubreddits) {
                subscribedSubreddits = extractedSubreddits;
                var frame = document.getElementById('optionswrapper-frame');
                frame.contentWindow.postMessage({
                    reason: "optionswrapper-opened-first",
                    data: subscribedSubreddits
                }, '*');
                document.getElementById('optionswrapper').style.display = "block";
            });
        } else {
            // we have seed data, caller function requests update
            if (forceRefresh) {
                utils.xhr.loadRecommendations(seedData, subscribedSubreddits, true, function(recommendations) {
                    processRecommendations(
                        recommendations,
                        "RRE Server appears to be offline...<br>Attempting automatically trying again in 30 minutes<br>(Or refresh the page)"
                    );
                });
            } else {
                // we have seed data, do we have recommendations?
                chrome.storage.sync.get([
                    'RRERecommendations'
                ], function(items) {
                    // There are no recommendations stored at all
                    if (!items.RRERecommendations) {
                        utils.xhr.loadRecommendations(seedData, subscribedSubreddits, true, function(recommendations) {
                            processRecommendations(
                                recommendations,
                                "RRE Server appears to be offline...<br>Attempting automatically trying again in 30 minutes<br>(Or refresh the page)"
                            );
                        });
                    } else {
                        // recommendations exist, do we need to query for more?
                        if (items.RRERecommendations.length <= seedData.RRERecommendationLimit + config.RRERecommendationsCacheBufferSize) {
                            // we do have seed data, need to update recommendations
                            if (!clearAll) {
                                clearRecommendations(clearAll, deletedRecommendation);
                            }
                            utils.xhr.loadRecommendations(seedData, subscribedSubreddits, false, function(recommendations) {
                                processRecommendations(
                                    recommendations,
                                    "RRE Server appears to be offline...",
                                    chrome.runtime.getURL('./img/loading-entry.gif')
                                );
                            });
                        } else {
                            clearRecommendations(clearAll, deletedRecommendation);
                            // we should still have enough recommendations due to RRERecommendationsCacheBufferSize, lets show them.
                            populateRecommendations(items.RRERecommendations, seedData.RRERecommendationLimit, seedData.RREBlackList);
                        }
                    }
                });
            }
        }
    });
}

function populateRecommendations(recommendations, recommendationLimit, blackList) {
    chrome.storage.sync.get([
        'RRERecommendationLimit',
        'RRERecommendations',
        'RREBlackList'
    ], function(items) {
        var recommendationsListDIV = document.getElementById("recommendations");
        var appendMessage = false;
        if (items.RRERecommendations.length !== 0) {
            function deleteCallback(subreddit) {
                utils.saveBlacklist(subreddit, function() {
                    refreshRecommendations(document.getElementById("recommendations-" + subreddit), false);
                });
            }

            var limit = items.RRERecommendationLimit;
            if (utils.getListEntryMessage("recommendations")) {
                limit++;
            }

            var i = 0;
            while (recommendationsListDIV.children.length < limit) {
                var subreddit = items.RRERecommendations[i].subreddit;
                if (items.RREBlackList.indexOf(subreddit) === -1) {
                    utils.createListEntry("recommendations", subreddit, false, deleteCallback);
                }
                i++;
                if (i >= items.RRERecommendations.length) {
                    // we dont have enough recommendations to display, exit the loop.
                    appendMessage = true;
                    break;
                }
            }
        } else {
            appendMessage = true;
        }

        if (appendMessage) {
            if (utils.xhr.loadingNewRecommendations) {
                if (!loadRecommendationsTimeout) {
                    utils.setListEntryMessage(
                        "recommendations",
                        "Loading New Recommendations ",
                        chrome.runtime.getURL('./img/loading-entry.gif')
                    );
                }
            } else {
                utils.setListEntryMessage("recommendations", "No More Recommendations :(");
            }
        } else {
            // remove message if exists
            utils.setListEntryMessage("recommendations");
        }
    });
}
