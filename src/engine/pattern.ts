import * as T from './tracks'
import { ChordLane } from './types'
import { getBeatLen, maybe, rand, randRange, sample } from './util'
import samples from './samples'

export const urlify = (sample: string) => `samples/${sample}.ogg`

export const getSamples = (track: string) => {
  const spec = samples[track]
  if (spec.length === 1) {
    return spec
  }
  return spec[1].map(x => `${spec[0]}_${x}`)
}

const createNote = (velocity = 0, pitch = null) => ({ velocity, pitch })

const getCurrentChord = (lane: ChordLane, i: number) => {
  if (lane[i]) {
    return lane[i]
  }
  let prev = i - 1
  while (!lane[prev] && prev > 0) {
    prev--
  }
  return lane[prev]
}

const getNextChordDistance = (lane, i) => {
  let next = i + 1
  while (!lane[next] && next < lane.length) {
    next++
  }
  if (next >= lane.length) {
    return {
      chord: lane[0],
      distance: lane.length - i
    }
  }
  return {
    chord: lane[next],
    distance: next - i
  }
}

const MIDI_C5 = 60
const MIDI_F5 = 65

const getPatternNote = (
  pattern,
  i: number,
  beatLen: number,
  isBeat,
  offBeat
) => {
  if (!isBeat && !offBeat) {
    return undefined
  }
  const patternStepLen = beatLen / 2
  const patternLenTicks = patternStepLen * pattern.length
  const currentPos = Math.floor((i % patternLenTicks) / patternStepLen)
  //console.log(pattern, i, patternStepLen, patternLenTicks, currentPos)
  return pattern[currentPos]
}

const handlePattern = (opts, key, i, pitch) => {
  const {
    state: { currentPattern, setPattern, clearPattern },
    beatLen,
    beatInfo: { isBeat, offBeat, isStartOfMeasure }
  } = opts
  let pattern = currentPattern
  let started = false
  const patternAuth = key === T.KICK
  let triggerPattern
  if (isStartOfMeasure && patternAuth) {
    triggerPattern = rand(20)
  }
  if (!currentPattern && triggerPattern) {
    pattern = setPattern()
    console.log('started pattern', i, pattern)
    started = true
  }
  if (pattern && pattern[key]) {
    if (!started && isStartOfMeasure && patternAuth) {
      console.log('cleared pattern', i)
      clearPattern()
    }
    const patternNote = getPatternNote(
      pattern[key],
      i,
      beatLen,
      isBeat,
      offBeat
    )
    if (patternNote) {
      return createNote(
        patternNote === 1 ? randRange(70, 99) : patternNote,
        pitch
      )
    }
    return createNote()
  }
}

const iterators = {
  default: {},
  jazz: {
    [T.BASS]: (i, pitch, lane: ChordLane, { beatLen }) => {
      let chord = getCurrentChord(lane, i)
      let bassnote = chord.bass
        ? chord.bassNote
        : chord.notes.filter(note => note.role === 'root')[0]
      let offset = chord.bass ? 12 : 0
      const nextChord = getNextChordDistance(lane, i)
      if (
        i % beatLen === 0 &&
        chord.root !== nextChord.chord.root &&
        nextChord.distance <= beatLen + 1
      ) {
        chord = nextChord.chord
        bassnote = chord.bass
          ? chord.bassNote
          : chord.notes.filter(note => note.role === 'root')[0]
        offset = (chord.bass ? 12 : 0) + maybe(50, 1, -1)
        return createNote(127, pitch + bassnote.midiNote - MIDI_C5 + offset)
      } else if ((i + beatLen) % (beatLen * 2) === 0) {
        const fifth = chord.notes.filter(note => note.role === 'fifth')
        const third = chord.notes.filter(note => note.role === 'third')
        if (fifth && rand(33)) {
          bassnote = fifth[0]
          offset = 0
        } else if (third && rand(50)) {
          bassnote = third[0]
          offset = 0
        }
        return createNote(127, pitch + bassnote.midiNote - MIDI_C5 + offset)
      } else if (i % beatLen === 0) {
        return createNote(127, pitch + bassnote.midiNote - MIDI_C5 + offset)
      }
      return createNote()
    }
  },
  [T.BASS]: (i, pitch, lane, { beatLen }) => {
    const chord = getCurrentChord(lane, i)
    const bassnote = chord.bass
      ? chord.bassNote
      : chord.notes.filter(note => note.role === 'root')[0]
    //console.log('bassnote', bassnote, chord)
    const offset = chord.bass ? 12 : 0
    if (i % (beatLen * 2) === 0 || (i + 2) % (beatLen * 2) === 0) {
      return createNote(127, pitch + bassnote.midiNote - MIDI_C5 + offset)
    }
    return createNote()
  },
  [T.RIDE]: (i, pitch, lane, { beatLen, beatInfo: { isFillAccent } }) => {
    const weak = (i + 2) % (beatLen * 2) === 0
    if (isFillAccent && rand(20)) {
      console.log('fill ride')
      return createNote(randRange(110, 127), pitch)
    }
    if (i % beatLen === 0 || weak) {
      return createNote(weak ? randRange(30, 64) : randRange(70, 108), pitch)
    }
    return createNote()
  },
  [T.HC]: (i, pitch, lane, opts) => {
    const { beatLen } = opts
    const ret = handlePattern(opts, T.HC, i, pitch)
    if (ret) {
      return ret
    }
    if ((i + beatLen) % (beatLen * 2) === 0) {
      return createNote(randRange(85, 108), pitch)
    }
    return createNote()
  },
  [T.KICK]: (i, pitch, lane, opts) => {
    const {
      beatInfo: { isBeat, offBeat, isFillAccent }
    } = opts

    if (isFillAccent && rand(15)) {
      console.log('fill kick')
      return createNote(randRange(110, 127), pitch)
    }

    const ret = handlePattern(opts, T.KICK, i, pitch)
    if (ret) {
      return ret
    }
    if ((isBeat || offBeat) && rand(5)) {
      return createNote(randRange(20, 109), pitch)
    }
    return createNote()
  },
  [T.SNARE]: (i, pitch, lane, opts) => {
    const {
      beatLen,
      isTriple,
      beatInfo: { offBeat, isBeat, isFillAccent }
    } = opts
    if (isFillAccent && rand(20)) {
      console.log('fill snare')
      return createNote(randRange(110, 126), pitch)
    }

    const ret = handlePattern(opts, T.SNARE, i, pitch)
    if (ret) {
      return ret
    }

    const mid = isTriple && (i - 2) % beatLen === 0
    if ((offBeat && rand(10)) || (isBeat && rand(5)) || (mid && rand(3))) {
      const roll = rand(5)
      return createNote(roll ? 127 : randRange(20, 109), pitch)
    }
    return createNote()
  }
}

const iteratePattern = ({ patternLength, pitch, chordLane, opts }, iterator) =>
  Array.from({ length: patternLength }).map((_, i) => {
    const { beatLen } = opts
    const isBeat = i % beatLen === 0
    const isStartOfMeasure =
      isBeat && i % (opts.timeSignature[0] * beatLen) === 0
    const beatInfo = {
      isBeat,
      offBeat: (i + 2) % beatLen === 0,
      isStartOfMeasure
    }
    return iterator(i, pitch, chordLane, { ...opts, beatInfo })
  })

const getOpts = timeSignature => ({
  timeSignature,
  isTriple: timeSignature[1] === 8,
  beatLen: getBeatLen(timeSignature)
})

export const createPattern = ({
  track,
  chordLane,
  style,
  timeSignature,
  state
}) => {
  const pitch = 0
  const patternLength = chordLane.length
  const iter = iterators[style][track]
    ? iterators[style][track]
    : iterators[track]

  return iteratePattern(
    {
      patternLength,
      pitch,
      chordLane,
      opts: { ...getOpts(timeSignature), state }
    },
    iter
  )
}

export const createChords = (
  scene,
  chordLane,
  key,
  samples,
  timeSignature,
  style
) => {
  const voices = [1, 2, 3, 4]
  const opts = getOpts(timeSignature)
  const patterns = voices.map(() =>
    iteratePattern(
      {
        patternLength: chordLane.length,
        pitch: 0,
        chordLane,
        opts
      },
      () => createNote()
    )
  )
  const jazz = opts.isTriple && style === 'jazz'
  for (let i = 0; i < chordLane.length; ++i) {
    const nextChord = chordLane[i]
    let pos = jazz ? i - opts.beatLen / 3 : i
    if (pos < 0) {
      pos += chordLane.length
    }
    if (nextChord) {
      let notes = jazz ? nextChord.voicing || nextChord.notes : nextChord.notes
      if (notes.length > 4) {
        notes = notes.filter(note => note.role !== 'root')
      }
      notes.forEach((note, j) => {
        if (j <= 3) {
          patterns[j][pos] = createNote(127, note.midiNote - MIDI_F5)
        }
      })
    }
  }
  voices.forEach((voice, i) => {
    const voiceKey = `${key}${voice}`
    scene.parts[voiceKey] = {
      samples,
      pattern: patterns[i]
    }
  })
}

const drumPatterns = [
  'sh-ssh-k',
  'sssh-hsk',
  '-hsh-hsh',
  '-s-ksh-k',
  '-sshshk-',
  'shksshk-',
  'shsh-sks',
  '-hkssksh'
].map(x => ({
  [T.SNARE]: x.split('').map(c => (c === 's' ? 1 : 0)),
  [T.KICK]: x.split('').map(c => (c === 'k' ? 1 : 0)),
  [T.HC]: x.split('').map(c => (c === 'h' ? 1 : 0))
}))

export const createDrums = (scene, chordLane, timeSignature, style) => {
  const voices = [T.KICK, T.SNARE, T.HC, T.RIDE]

  const state = {
    currentPattern: undefined
  }
  state.setPattern = () => {
    const p = sample(drumPatterns)
    state.currentPattern = p
    return p
  }
  state.clearPattern = () => {
    state.currentPattern = undefined
  }

  const opts = { ...getOpts(timeSignature), state }
  const jazz = opts.isTriple && style === 'jazz'

  const patternLength = chordLane.length
  const pitch = 0

  const patterns = voices.map(track =>
    Array.from({ length: patternLength }).map((_, i) => undefined)
  )

  Array.from({ length: patternLength }).map((_, i) => {
    voices.forEach((track, v) => {
      const iter = iterators[style][track]
        ? iterators[style][track]
        : iterators[track]

      const { beatLen } = opts
      const isBeat = i % beatLen === 0
      const offBeat = (i + 2) % beatLen === 0
      const beatsPerBar =
        opts.timeSignature[1] === 4
          ? opts.timeSignature[0]
          : opts.timeSignature[0] === 12 || opts.timeSignature[0] === 9
          ? 4
          : 4
      const measure = i / (beatsPerBar * beatLen)
      const currentMeasure = Math.floor(measure) + 1
      const currentBarProgress = 1 - (currentMeasure - measure)
      const isStartOfMeasure =
        isBeat && i % (opts.timeSignature[0] * beatLen) === 0
      const isFillAccent =
        offBeat && currentMeasure % 4 === 0 && currentBarProgress > 0.9
      const beatInfo = {
        isBeat,
        offBeat,
        isStartOfMeasure,
        isFillAccent
      }
      patterns[v][i] = iter(i, pitch, chordLane, { ...opts, beatInfo })
    })
  })

  for (let i = 0; i < chordLane.length; ++i) {}
  voices.forEach((voice, i) => {
    const samples = getSamples(voice)
    scene.parts[voice] = {
      style,
      samples: samples.map(urlify),
      pattern: patterns[i]
    }
  })
}
