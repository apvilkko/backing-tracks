<template>
  <input
    class="searchbox"
    type="text"
    placeholder="Search employees by name"
    :value="value"
    @input="onInput">
  </input>
</template>

<script>
import _ from 'lodash/fp';

export default {
  props: ['value'],
  created() {
    this.onInput = _.debounce(800)(this.onInput);
  },
  methods: {
    onInput() {
      this.$emit('input', this.$el.value);
    }
  }
};

</script>

<style lang="scss" scoped>
@import "assets/constants";

.searchbox {
  width: 100%;
  height: 50px;

  padding: $baseline;
  margin: $baseline;

  font-size: $font-size-small;
  color: $color-text-dark;

  outline-offset: 0;
  outline: 1px solid transparent;

  transition: outline-color .2s ease-in-out;

  &:focus {
    outline-color: $color-brand-secondary;
  }
}
</style>
