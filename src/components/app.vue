<template>
  <div class="app-wrapper">
    <h1>I Am Your Band Now</h1>
    <temp-input v-model="textInput" @done="onDone"></temp-input>
    <preset-selector @changed="onPresetChange"></preset-selector>
    <tempo-input v-model="tempo" @changed="onTempoChanged"></tempo-input>
    <chord-lane :lane="engine.chordLane" :position="chordPosition" />
    <div>
      <button @click="toggle">play/pause</button>
    </div>
    <!-- <pre>{{engine.ctx}}</pre> -->
  </div>
</template>

<script>
import TempInput from './temp-input'
import ChordLane from './chord-lane'
import PresetSelector from './preset-selector'
import TempoInput from './tempo-input'
import { createEngine } from '../engine'

const engine = createEngine()

export default {
  name: 'App',
  components: {
    TempInput,
    ChordLane,
    PresetSelector,
    TempoInput
  },
  data: () => ({
    engine,
    tempo: 120,
    textInput: ''
  }),
  mounted() {
    this.tempo = this.engine.getTempo()
  },
  computed: {
    chordPosition() {
      return this.engine.getChordPosition()
    }
  },
  methods: {
    onDone(value) {
      this.engine.setSongFromChordInput(value)
    },
    onPresetChange(preset) {
      const value = preset
      this.engine.setPreset(preset)
      this.tempo = this.engine.getTempo()
      this.textInput = value.string
    },
    onTempoChanged(value) {
      this.engine.setTempo(value)
    },
    toggle() {
      this.engine.toggle()
    }
  }
}
</script>

<style lang="scss">
html,
body,
button,
select,
option,
input {
  font-size: 18px;
}

h1 {
  text-transform: uppercase;
}

button,
select {
  padding: 1em;
}
</style>
