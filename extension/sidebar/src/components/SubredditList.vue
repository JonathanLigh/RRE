<template>
    <div class="container">
        <div class="list"
            <ul>
                <li v-for="subreddit in subredditSlice">
                    <a :href="linkify(subreddit.url)">{{subreddit.url}}</a>
                </li>
            </ul>
        </list>
        <div class="pagination" v-if="subreddits.length > subredditMaxViewAmount">
            <div>
                <div :class="currentPage===1 ? 'blockedButton': 'activeButton'" v-on:click="navigatePrevious">Prev</div>
            </div>
            <div>
              <h3>{{currentPage}}/{{totalPages}}</h3>
            </div>
            <div>
                <div :class="currentPage===totalPages ? 'blockedButton': 'activeButton'" v-on:click="navigateNext">Next</div>
            </div>
        </div>
    </div>
</template>
<script>
export default {
    data() {
      return {
       subredditStart: 0,
      }
    },
    props: [
      'subredditMaxViewAmount',
      'subreddits'
    ],
    computed:{
      subredditEnd: function() {
        if(this.subredditStart + this.subreddits.subredditMaxViewAmount > this.subreddits.length) {
          return this.subreddits.length;
        }
        else {
          return this.subredditStart + this.subredditMaxViewAmount;
        }
      },
      subredditSlice: function() {
        return this.subreddits.slice(this.subredditStart, this.subredditEnd);
      },
      currentPage: function() {
        return Math.ceil((this.subredditStart + 1)/ this.subreddits.length);
      },
      totalPages: function() {
        return Math.ceil(this.subreddits.length/this.subredditMaxViewAmount);
      }
    },
    methods: {
        navigateNext() {
          this.subredditStart += this.subredditMaxViewAmount;
        },
        navigatePrevious() {
            if(this.subredditStart > this.subredditMaxViewAmount) {
                this.subredditStart -= this.subredditMaxViewAmount;
            }
            else {
                this.subredditStart = 0;
            }
        },
        linkify: function(url) {
          return 'https://reddit.com' + url  
        }
    }
}
</script>
<style scoped>
.pagination {
  font-weight: bold;
  display: grid;
  grid-template-columns: 80px 80px 80px;
  grid-gap: 2px;
  text-align: center;
}
.activeButton {
 color: White;
 background: Blue;
}
.blockedButton{
  color: White;
  background: DarkGray;
}

</style>

