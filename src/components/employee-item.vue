<template>
  <li class="employee-item">
    <transition name="fade">
      <div class="processing-overlay" v-if="isProcessing">
        <i class="fa fa-grav fa-spin processing-icon" aria-hidden="true"></i>
      </div>
    </transition>
    <div class="avatar">
      <i class="fa fa-user-circle-o avatar-icon"></i>
    </div>
    <div class="buttons">
      <action-button text="fire" icon="bomb" @click="onFireClick"></action-button>
    </div>
    <div>
      <span class="name">{{ employee.name }}</span>
      <span class="title">{{ employee.jobTitle }}</span>
    </div>
  </li>
</template>

<script>
import ActionButton from './action-button';

export default {
  components: {
    ActionButton
  },
  props: {
    employee: {
      type: Object,
      required: true
    },
    isProcessing: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    onFireClick() {
      this.$emit('fire', this.employee);
    }
  }
};

</script>

<style lang="scss" scoped>
@import "assets/constants";
@import "assets/mixins";

$avatar-size: 80px;
$avatar-icon-size: 55px;

.employee-item {
  display: block;
  position: relative;

  width: 100%;
  min-height: $avatar-size + 2*$baseline;

  padding: $baseline;

  list-style: none;

  &:not(:last-of-type):after {
    content: "";
    position: absolute;
    right: 0; bottom: 0; left: 0;
    border-bottom: 1px solid $color-element-light;
  }
}

.avatar {
  float: left;

  width: $avatar-size;
  height: $avatar-size;

  text-align: center;
  vertical-align: middle;

  border-radius: 5px;
  background-color: $color-element-light;

  .avatar-icon {
    font-size: $avatar-icon-size;
    line-height: $avatar-size;
    color: darken($color-element-light, 10%);
  }
}

.buttons {
  float: right;
  margin-top: $baseline;
}

.name {
  @include ellipsize;
  display: block;

  padding: $baseline $baseline 3px $baseline;

  color: $color-text-dark;
  font-size: $font-size-small;
  font-weight: $font-weight-bold;
}

.title {
  @include ellipsize;
  display: block;

  padding: 4px $baseline 3px $baseline;

  color: $color-text-semidark;
  font-size: $font-size-tiny;
}

.processing-overlay {
  position: absolute;
  top: 0; right: 0; bottom: 0; left: 0;

  text-align: center;

  background-color: transparentize(white, 0.1);

  .processing-icon {
    position: absolute;
    top: 20px;

    font-size: 50px;
    color: $color-element-medium;

    background-color: white;
    border-radius: 50%;
  }
}

</style>
