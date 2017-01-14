import ChordParser from './chord-builder/parser';
import ChordBuilder from './chord-builder/builder';
import {initCtx, newScene, toggle} from './audio';
import presets from './presets';

class Engine {
  constructor() {
    this.reset();
    this.parser = new ChordParser();
    this.builder = new ChordBuilder();
    if (typeof window !== 'undefined') {
      this.ctx = initCtx();
    }
  }

  reset() {
    this.key = null;
    this.tempo = 120;
    this.timeSignature = [4, 4];
    this.shufflePercentage = 0;
    this.isSwing = false;
    this.chordLane = [];
    this.style = 'default';
  }

  toggle() {
    toggle(this.ctx);
  }

  updateScene() {
    newScene(this.ctx, {
      tempo: this.tempo,
      style: this.style,
      shufflePercentage: this.shufflePercentage,
      chordLane: this.chordLane,
    });
    //toggle(this.ctx);
  }

  getPreset(presetId) {
    return presets.find(p => p.id === presetId);
  }

  setPreset(presetId) {
    const preset = this.getPreset(presetId);
    this.tempo = preset.tempo;
    this.style = preset.style || 'default';
    this.setSongFromChordInput(preset.string);
  }

  setSongFromChordInput(value) {
    this.chordLane = [];
    const pattern = /([^ ]+)\s+(\d+)/g;
    const matches = value.match(pattern);
    const chords = (matches || []).map(item => {
      const parts = item.split(' ');
      const duration = parseFloat(parts[1]);
      this.parser.parse(parts[0].trim());
      this.builder.buildChord(this.parser.model);
      return {
        chord: {
          ...this.builder.model,
          name: this.parser.toString(),
        },
        duration,
      }
    });

    const beatLength = Math.round(4 * this.timeSignature[0] / this.timeSignature[1]);
    chords.forEach(item => {
      for (let i = 0; i < item.duration * beatLength; ++i) {
        this.chordLane.push(i === 0 ? item.chord : null);
      }
    });
    this.updateScene();
  }
}

export const createEngine = () => new Engine();
