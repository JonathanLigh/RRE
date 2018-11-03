<template>
  <div class="Home">
    <link rel="stylesheet" type="text/css" href="//www.redditstatic.com/reddit.cqL5rDYDfmo.css" media="all">
    <div id="header-bottom-left">
      <ul class="tabmenu">
        <div class="tab-button" v-for="tab in tabs">
          <div v-bind:class="[selectedTab === tab ? 'selected' : 'unSelected', errorClass]"
          v-on:click="selectedTab=tab">
            <div>{{tab}}</div>
          </div>
        </div>
      </ul>
    </div>
    <div v-if="selectedTab==='Search'">
      <Search :query="searchQuery" v-on:message="handleSearchUpdate"></Search>
    </div>
    <div v-if="selectedTab==='Settings'">
      <Settings :maxRec="maxRecommendations" :nsfw="NSFW" v-on:message="handleSettingsUpdate"></Settings>
    </div>
    <div v-if="selectedTab==='Blacklist'">
      <Blacklist :list="blacklist" v-on:message="handleBlacklistUpdate"></Blacklist>
    </div>
    <div v-if="searchResults.length > 0">
      <SubredditList :subreddits="searchResults" :subredditMaxViewAmount="resultListSize" v-on:message="handleSettingsUpdate"></SubredditList>
    </div>
  </div>
</template>
<script>

import Blacklist from './Tabs/Blacklist.vue';
import Search from './Tabs/Search.vue';
import Settings from './Tabs/Settings.vue';
import SubredditList from './SubredditList.vue';
import axios from 'axios';

export default {
  name: '',
  data () {
    return {
      tabs: [
        'Search',
        'Settings',
        'Blacklist'
      ],
      selectedTab: 'Search',
      blacklist: '',
      maxRecommendations: 30,
      NSFW: false,
      searchQuery: '',
      searchResults: [],
      resultListSize: 10,
      RRERecommendationsCacheSize: 100,
      RRERecommendationsCacheBufferSize: 10,
      closeModalTimeoutDuration: 1000,
      displayStatusMessageDuration: 1000,
      RREServerURL: "https://localhost:8080",
      retryRequestToServerTimeoutDuration: 1800000
    }
  },
  components: {
    Blacklist,
    Search,
    Settings,
    SubredditList
  },
  methods: {
    handleSearchUpdate: function (payload) {
      this.searchQuery = payload.message;
      this.getSearchResults(this.searchQuery);
    },
    handleBlacklistUpdate: function (payload) {
      this.blacklist = payload.message;
    },
    handleSettingsUpdate: function (payload) {
      this.maxRecommendations = payload.maxRec;
      this.NSFW = payload.nsfw;
    },
    getBlacklistArray: function() {
      return this.blacklist.replace(/\s/g, '').split(',');
    },
    getTagsForSubscriptions: function (subscribedSubreddits, maxDistance) {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', RREServerURL + '/api/subreddits/getTagsFromSuscribedSubreddits');
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
    },
    getSearchResults: function (query) {
      /*
        var xhr = new XMLHttpRequest();
        xhr.open('POST', this.RREServerURL + '/api/subreddits/search');
        xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

        xhr.onload = function() {
            if (this.status === 200) {
              var response = JSON.parse(this.response);

              this.searchResults = [];

              for(tag in response) {
                for(subreddit in tag.subreddits) {
                  this.searchResults.push({"url": subreddit.url});
                }
              }
            }
        }

        xhr.send({
          "query": this.searchQuery
        });

      fetch(RREServerURL + '/api/subreddits/search', {
        method: 'POST', // or 'PUT'
        body: `"query": ` + query,
        headers: new Headers({
          'Content-Type': "application/json;charset=UTF-8"
        })
      }).then(res => {
        var response = res.json()
        searchResults = [];
        for(let subreddit of response) {
          searchResults.push({"url": subreddit.url});
        }
      }
      */

    axios.post(this.RREServerURL + '/api/subreddits/search', {
        headers: {
          "Content-Type": "application/json;charset=UTF-8"
        },
        "query" : query
      }).then(response => {
        this.searchResults = [];
        for(let subreddit of response.data) {
          this.searchResults.push({"url": subreddit.url});
        }
      });
    }
  }
}
</script>
<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.Home {
  width: 300px;
}
.tab-button {
  font-weight: bold;
}
.tabmenu {
  display: grid;
  grid-template-columns: 80px 80px 80px;
  grid-gap: 2px;
}
.unSelected {
  padding: 2px 6px 0px 6px;
  color: #369;
  border: 1px solid #eff7ff;
  background-color: #eff7ff;
}
.selected {
  color: orangered;
  padding: 2px 6px 0px 6px;
  background-color: white;
  border: 1px solid #5f99cf;
  border-bottom: 1px solid white;
}
#header-bottom-left {
  border: 1px solid #5f99cf;
  z-index: 99;
  background-color: #cee3f8;

}
</style>
