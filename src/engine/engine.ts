import ChordParser from './chord-builder/parser'
import ChordBuilder from './chord-builder/builder'
import { initCtx, newScene, toggle, reset } from './audio'
import presets from './presets'
import { setScene } from './stateful-web-audio'
import { ChordLane, Preset } from './types'
import { readPreset } from './read-preset'
import { clearBassMemory } from './pattern'

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

  playFromStart(play?: boolean) {
    reset(this.ctx)
    clearBassMemory()
    if (play !== false) {
      this.toggle(true)
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

  toggle(state?: boolean) {
    toggle(this.ctx, state)
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
    this.playFromStart(false)
  }

  getPreset(presetId: string): Preset | undefined {
    return presets.find(p => p.id === presetId)
  }

  setPreset(preset: Preset) {
    this.toggle(false)
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
      engine.setPreset(presets[0])
    }
  }, 500)
  setTimeout(() => {
    if (process.env.NODE_ENV === 'development') {
      engine.toggle()
    }
  }, 520)

  return engine
}
