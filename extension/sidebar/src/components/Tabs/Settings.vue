<template>
    <div class="settings">
      <div class=settingsGrid>
        <h3>Max Recommendations: </h3><input type="number" name="Max Recommendations" min="1" max="50" v-model="maxRec"></input>
        <h3>NSFW: </h3><input type="checkbox" v-model="nsfw"></input>
      </div>
      <div>
        <button class="saveSettings" v-on:click="saveSettings">Save Settings</button>
      </div>
    </div>
</template>
<script>
export default  {
    props: [
      'maxRec',
      'nsfw'
      ],
    methods: {
        saveSettings: function() {
            this.$emit('message', { maxRec: this.maxRec, nsfw: this.nsfw})
        }
    }

}
</script>
<style scoped>
.settings {
  text-align: center;
}

.settingsGrid {
  display: grid;
  grid-template-columns: 150px 150px;
  font-weight: bold;
  width: 100%;
}
.saveSettings {
  width: 100%;
}

</style>
