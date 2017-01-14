<template>
  <input
    type="number"
    placeholder="tempo"
    :value="value"
    @change="onChange"
  >
  </input>
</template>

<script>

export default {
  props: ['value'],
  methods: {
    onChange() {
      this.$emit('changed', this.$el.value);
    }
  }
};

</script>

<style lang="scss" scoped>

@import "assets/constants";

input {
  margin-top: 0.5em;
  padding: 0.2em;
}

</style>
