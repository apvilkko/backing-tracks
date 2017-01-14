<template>
  <div>
  <!--<pre>{{lane}}</pre>-->
  <ul>
    <li v-for="item in chords">
      {{item.name}}
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
  },
  computed: {
    chords() { return this.lane.filter(item => !!item) },
  }
};
</script>

<style lang="scss" scoped>
@import "assets/constants";

ul {
  list-style-type: none;
  max-width: 30em;
}

li {
  border: 1px solid;
  line-height: 1;
  display: inline-block;
  padding: 1em;
}

li:nth-child(4):after {
  content: "\A";
  white-space: pre;
}

</style>
