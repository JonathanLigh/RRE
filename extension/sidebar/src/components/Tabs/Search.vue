<template>
    <div>
        <input v-model="query" placeholder="Subreddit Search">
        <button  tabindex="22" type=submit v-on:click="search">🔍</button><!-- search emoji -->
        <div class=results></div>
    </div>
</template>
<script>
export default {
    props: ['query'],
    methods: {
        search: function ()   {
            this.$emit('message', { message: this.query})
        }
    }
}
</script>
