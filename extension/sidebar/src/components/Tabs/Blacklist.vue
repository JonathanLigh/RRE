<template>
    <div class="blacklist">
        <textarea v-model="list" class="blacklist" placeholder="Blacklist"></textarea>
        <button v-on:click="updateBlacklist">Update Blacklist</button>
    </div>
</template>
<script>
export default  {
    props: ['list'],
    methods: {
        updateBlacklist: function() {
            this.$emit('message', { message: this.list})
        }
    }

}
</script>
<style scoped>
blacklist   {
    height: 80px;
}

</style>
