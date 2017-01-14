<template>
  <select v-model="selected" v-on:change="onChange">
    <option value="">Select preset song…</option>
    <option v-for="preset in presets" v-bind:value="preset.id">
      {{preset.name}}
    </option>
  </select>
</template>

<script>

import presets from '../engine/presets';

export default {
  data: () => ({
    presets,
    selected: '',
  }),
  methods: {
    onChange() {
      this.$emit('changed', this.selected);
    }
  }
};
</script>

<style lang="scss" scoped>

@import "assets/constants";

select {
  margin-top: 1em;
  display: block;
}

</style>
