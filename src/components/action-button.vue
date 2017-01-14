<template>
  <button type="button" class="action-button" @click="onClick">
    <i :class="iconClasses" aria-hidden="true"></i>
    {{ text }}
  </button>
</template>

<script>

export default {
  props: {
    text: {
      type: String,
      required: true
    },
    icon: {
      type: String,
      required: true
    }
  },
  computed: {
    iconClasses() {
      return {
        fa: true,
        [`fa-${this.icon}`]: true
      };
    }
  },
  methods: {
    onClick() {
      this.$emit('click');
    }
  }
};
</script>

<style lang="scss" scoped>
@import "assets/constants";

.action-button {
  padding: 8px 12px;

  cursor: pointer;

  text-transform: uppercase;

  font-family: $font-family-alternative;
  font-size: $font-size-tiny;
  font-weight: $font-weight-bold;
  color: $color-text-semidark;

  border: 1px solid $color-element-medium;
  border-radius: 4px;

  background-color: white;

  transition: box-shadow .2s ease-in-out;

  .fa {
    margin-right: 4px;
    color: $color-text-semidark;
  }

  &:active, &:focus {
    outline: none;
    box-shadow: 0 0 0 1px $color-brand-secondary;
  }

  &:hover {
    background-color: $color-element-light;
    color: $color-text-dark;
  }
}
</style>
