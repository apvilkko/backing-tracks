<template>
  <select v-model="selected" v-on:change="onChange">
    <option value="">Select preset song…</option>
    <option
      v-for="preset in presets"
      v-bind:value="preset.id"
      v-bind:key="preset.id"
    >
      {{ preset.name }}
    </option>
  </select>
</template>

<script>
import presets from '../engine/presets'

export default {
  data: () => ({
    presets: [],
    selected: ''
  }),
  methods: {
    onChange() {
      this.$emit(
        'changed',
        this.presets.find(x => x.id === this.selected)
      )
    }
  },
  created: function() {
    fetch('jazzStandards.json')
      .then(res => res.json())
      .then(res => {
        this.presets = presets.concat(
          res.map(x => ({ ...x, style: 'jazz', swing: true }))
        )
      })
  }
}
</script>

<style lang="scss" scoped>
@import '../style/constants';

select {
  margin-top: 1em;
  display: block;
}
</style>
