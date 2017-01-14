<template>
  <input
    class="searchbox"
    type="text"
    placeholder="enter chords"
    :value="value"
    @keyup.enter="onEnter"
  >
  </input>
</template>

<script>

export default {
  props: ['value'],
  methods: {
    onEnter() {
      this.$emit('done', this.$el.value);
    }
  }
};

</script>

<style lang="scss" scoped>

@import "assets/constants";

input {
  width: 90%;
  padding: 0.5em;
}

</style>
