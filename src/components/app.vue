<template>
  <div class="app-wrapper">
    <h1>I Am Your Band Now</h1>
    <temp-input v-model="textInput" @done="onDone"></temp-input>
    <preset-selector @changed="onPresetChange"></preset-selector>
    <chord-lane :lane="engine.chordLane" />
    <button @click="toggle">play/pause</button>
    <!-- <pre>{{engine.ctx}}</pre> -->
  </div>
</template>

<script>

import TempInput from './temp-input';
import ChordLane from './chord-lane';
import PresetSelector from './preset-selector';
import {createEngine} from '../engine';

const engine = createEngine();

export default {
  name: 'App',
  components: {
    TempInput,
    ChordLane,
    PresetSelector,
  },
  props: {
    textInput: String
  },
  data: () => ({
    engine
  }),
  mounted() {
    this.textInput = 'C 4 Am7 4 Dm7 4 F/G 2 G 2';
  },
  methods: {
    onDone(value) {
      this.engine.setSongFromChordInput(value)
    },
    onPresetChange(presetId) {
      const value = this.engine.getPreset(presetId);
      this.textInput = value.string;
      this.engine.setPreset(presetId);
    },
    toggle() {
      this.engine.toggle();
    }
  },
};

</script>

<style>

html, body, button, select, option, input {
  font-size: 18px;
}

h1 {
  text-transform: uppercase;
}

button, select {
  padding: 1em;
}

</style>
