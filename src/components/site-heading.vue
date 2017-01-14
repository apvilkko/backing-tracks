<template>
  <h1 class="heading">{{ title }}</h1>
</template>

<script>

export default {
  props: {
    title: {
      type: String,
      required: true
    }
  }
};
</script>

<style lang="scss" scoped>
@import "assets/constants";

.heading {
  text-align: center;
  color: $color-brand-primary;

  font-family: $font-family-alternative;
  font-weight: $font-weight-black;
  font-size: $font-size-huge;
}

</style>
