import ChordParser from './chord-builder/parser'
import ChordBuilder from './chord-builder/builder'
import { initCtx, newScene, toggle } from './audio'
import presets from './presets'
import { setScene } from './stateful-web-audio'
import { ChordLane, Preset } from './types'
import { readPreset } from './read-preset'

class Engine {
  chordLane: ChordLane
  tempo: number
  timeSignature: [number, number]
  shufflePercentage: number
  style: string

  constructor() {
    this.reset()
    this.parser = new ChordParser()
    this.builder = new ChordBuilder()
    if (typeof window !== 'undefined') {
      this.ctx = initCtx()
    }
  }

  reset() {
    this.key = null
    this.tempo = 120
    this.timeSignature = [4, 4]
    this.shufflePercentage = 0
    this.chordLane = []
    this.style = 'default'
  }

  toggle() {
    toggle(this.ctx)
  }

  setTempo(value) {
    this.tempo = value
    this.ctx.state.scene.tempo = value
    setScene(this.ctx, this.ctx.state.scene)
  }

  getTempo() {
    return this.tempo
  }

  updateScene() {
    newScene(this.ctx, {
      tempo: this.tempo,
      style: this.style,
      shufflePercentage: this.shufflePercentage,
      chordLane: this.chordLane,
      timeSignature: this.timeSignature
    })
    //toggle(this.ctx);
  }

  getPreset(presetId: string): Preset | undefined {
    return presets.find(p => p.id === presetId)
  }

  setPreset(preset: Preset) {
    this.tempo = preset.tempo
    this.style = preset.style || 'default'
    let ts = preset.ts
    if (ts) {
      ts = ts.split('/').map(x => Number(x))
    }
    this.timeSignature = ts || [4, 4]
    if (preset.swing && this.timeSignature[1] === 4) {
      this.timeSignature[0] *= 3
      this.timeSignature[1] *= 2
    }
    this.setSongFromChordInput(preset.string)
  }

  getChordPosition() {
    return this.ctx.runtime.sequencer.currentNote
  }

  setSongFromChordInput(value) {
    this.chordLane = readPreset(
      value,
      this.parser,
      this.builder,
      this.timeSignature
    )
    this.updateScene()
  }
}

export const createEngine = () => {
  const engine = new Engine()
  setTimeout(() => {
    if (process.env.NODE_ENV === 'development') {
      engine.setPreset(presets[3])
    }
  }, 500)

  return engine
}
