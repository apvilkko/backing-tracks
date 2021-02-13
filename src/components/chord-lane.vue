<template>
  <div>
    <!--<pre>{{lane}}</pre>-->
    <ul>
      <li
        v-for="item in chords"
        v-bind:class="{ playback: isCurrent(item), split: shouldSplit(item) }"
      >
        {{ item.name }}
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  props: {
    lane: {
      type: Array,
      required: true
    },
    position: {
      type: Number
    }
  },
  computed: {
    chords() {
      return this.lane.filter(item => !!item)
    }
  },
  methods: {
    isCurrent(item) {
      return item && this.position === item._position
    },
    shouldSplit(item) {
      return item._position % 64 === 0
    }
  }
}
</script>

<style lang="scss" scoped>
@import '../style/constants';

ul {
  list-style-type: none;
  max-width: 30em;
  &:after {
    clear: both;
    content: '';
    display: table;
  }
}

li {
  float: left;
  border: 1px solid;
  line-height: 1;
  display: inline-block;
  padding: 0.3em 1em;
  min-width: 2em;
  margin-bottom: 0.5em;
  margin-right: -1px;
  background-color: white;
  &:not(.playback) {
    transition: background-color 2s;
  }
}

.playback {
  background-color: #bcb;
}

.split {
  clear: left;
}
</style>
