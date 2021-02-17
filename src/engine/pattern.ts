import * as T from './tracks'
import { ChordLane, ChordLaneChord, Note, TimeSignature } from './types'
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

const createNote = (velocity?: number, pitch?: number) => ({
  velocity: velocity || 0,
  pitch: pitch || null
})

const getCurrentChord = (lane: ChordLane, index: number) => {
  const i = index % lane.length
  if (lane[i]) {
    return lane[i]
  }
  let prev = i - 1
  while (!lane[prev] && prev > 0) {
    prev--
  }
  return lane[prev]
}

type NextChordType = {
  at: number
  distance: number
  chord: ChordLaneChord
}

const getNextChords = (
  lane: ChordLane,
  index: number,
  lookAhead: number
): Array<NextChordType> => {
  let p = index
  const out: Array<NextChordType> = []
  while (p <= index + lookAhead) {
    const i = p % lane.length
    if (lane[i]) {
      out.push({ at: p, distance: p - index, chord: lane[i] as ChordLaneChord })
    }
    p++
  }
  return out
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

const handlePattern = (opts: IteratorOpts, key, i, pitch) => {
  const {
    state: { currentPattern, setPattern, clearPattern },
    beatLen,
    beatInfo: { isBeat, offBeat, isStartOfMeasure }
  } = opts
  let pattern = currentPattern
  let started = false
  const patternAuth = key === T.KICK
  let triggerPattern
  if (isStartOfMeasure(i) && patternAuth) {
    triggerPattern = rand(20)
  }
  if (!currentPattern && triggerPattern) {
    pattern = setPattern()
    //console.log('started pattern', i, pattern)
    started = true
  }
  if (pattern && pattern[key]) {
    if (!started && isStartOfMeasure(i) && patternAuth) {
      //console.log('cleared pattern', i)
      clearPattern()
    }
    const patternNote = getPatternNote(
      pattern[key],
      i,
      beatLen,
      isBeat(i),
      offBeat(i)
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

type GeneratedNote = {
  velocity: number
  pitch: number | null
}

type IteratorBeatInfo = {
  isFillAccent: (i: number) => boolean
  isBeat: (i: number) => boolean
  offBeat: (i: number) => boolean
  isStartOfMeasure: (i: number) => boolean
  beatsPerBar: (i: number) => number
}

type IteratorOpts = {
  beatLen: number
  isTriple: boolean
  beatInfo: IteratorBeatInfo
  timeSignature: TimeSignature
  state?: Record<string, unknown>
}

interface IteratorFn {
  (i: number, pitch: number, lane: ChordLane, opts: IteratorOpts): GeneratedNote
}

type Iterators = {
  [x: string]: IteratorFn | Iterators
}

const getBeatsPerBar = (i: number, timeSignature: TimeSignature) => {
  return timeSignature[1] === 4
    ? timeSignature[0]
    : timeSignature[0] === 12 || timeSignature[0] === 9
    ? 4
    : 4
}

const getLookAhead = (
  bars: number,
  timeSignature: TimeSignature,
  beatLen: number
) => {
  return Math.round(bars * beatLen * getBeatsPerBar(0, timeSignature))
}

type NoteProps = { note: Note; offset?: number }

const selectBassNote = (chord: ChordLaneChord): NoteProps => {
  if (chord.bass) {
    return { note: chord.bassNote, offset: 12 }
  }
  const root = chord.notes.filter(note => note.role === 'root')[0]
  const third = chord.notes.filter(note => note.role === 'third')[0]
  const fifth = chord.notes.filter(note => note.role === 'fifth')[0]
  let note = root
  if (rand(75)) {
    // pass
  } else {
    if (rand(75)) {
      note = third || root
    } else {
      note = fifth || third || root
    }
  }
  return { note }
}

const selectLeadingTone = (nextNote: Note): NoteProps => {
  const note = { midiNote: nextNote.midiNote + (rand(50) ? 1 : -1) }
  return { note }
}

type BassState = {
  memorySet: number | undefined
  memory: Array<{ pos: number; chord?: ChordLaneChord } & NoteProps>
}

const sortMemory = arr =>
  arr.sort((a, b) => {
    if (a.pos < b.pos) return -1
    if (a.pos > b.pos) return 1
    return 0
  })

const iterators: Iterators = {
  default: {},
  jazz: {
    [T.BASS]: (i, pitch, lane, opts) => {
      const { timeSignature, beatLen } = opts
      const state = opts.state as BassState
      const lookAheadTime = getLookAhead(2.1, timeSignature, beatLen)
      const nextChords = getNextChords(lane, i, lookAheadTime)

      if (!state.memorySet) {
        // First place chord changes
        for (let c = 0; c < nextChords.length; ++c) {
          const nc = nextChords[c].chord
          const noteProps = selectBassNote(nc)
          state.memory.push({ pos: nextChords[c].at, chord: nc, ...noteProps })
        }
        // Then place leading tones
        for (let c = 0; c < nextChords.length; ++c) {
          const mem = state.memory[c]
          const pos = mem.pos - beatLen
          if (pos % lane.length >= i) {
            const noteProps = selectLeadingTone(mem.note)
            state.memory.push({ pos, ...noteProps })
          }
        }
        state.memory = sortMemory(state.memory)
        // Fill out gaps
        for (let c = 0; c < state.memory.length; ++c) {
          const mem = state.memory[c]
          const nextMem = state.memory[c + 1]
          if (mem && nextMem) {
            const numBeats = Math.floor((nextMem.pos - (mem.pos + 1)) / beatLen)
            const noteDifference = nextMem.note.midiNote - mem.note.midiNote
            if (numBeats && Math.abs(noteDifference) === numBeats + 1) {
              // direct chromatic walk possible
              console.log('chromatic walk', mem, nextMem)
              for (let x = 0; x < numBeats; ++x) {
                const newNote = {
                  pos: mem.pos + beatLen * (x + 1),
                  note: {
                    midiNote:
                      mem.note.midiNote +
                      (x + 1) * (noteDifference > 1 ? 1 : -1)
                  }
                }
                console.log(newNote)
                state.memory.push(newNote)
              }
            }
          }
        }

        const maxIndex = state.memory.reduce(
          (acc, curr) => Math.max(curr.pos, acc),
          0
        )
        state.memorySet = maxIndex
        state.memory = sortMemory(state.memory)
      } else {
        const ind = state.memory.findIndex(x => i === x.pos % lane.length)
        if (ind > -1) {
          const match = { ...state.memory[ind] }
          if (ind === state.memory.length - 1) {
            // clear memory
            state.memory = []
            state.memorySet = undefined
          }
          return createNote(
            127,
            pitch + match.note.midiNote - MIDI_C5 + (match.offset || 0)
          )
        }
      }

      /*if (
        beat &&
        chord.root !== nextChord.chord.root &&
        nextChord.distance <= beatLen + 1
      ) {
        // leading tone
        const nc = nextChord.chord
        bassnote = nc.bass
          ? nc.bassNote
          : nc.notes.filter(note => note.role === 'root')[0]
        offset = (nc.bass ? 12 : 0) + maybe(50, 1, -1)
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
      } else if (beat) {
        return createNote(127, pitch + bassnote.midiNote - MIDI_C5 + offset)
      }*/
      return createNote()
    }
  },
  [T.BASS]: (i, pitch, lane, { beatLen }) => {
    const chord = getCurrentChord(lane, i)
    const bassnotes = chord.bass
      ? { root: chord.bassNote }
      : chord.notes
          .filter(
            note =>
              note.role === 'root' ||
              note.role === 'fifth' ||
              note.role === 'third'
          )
          .reduce((acc, c) => {
            acc[c.role] = c
            return acc
          }, {})
    const bassnote = bassnotes.root
    //console.log('bassnote', bassnote, chord)
    const offset = chord.bass ? 12 : 0
    if (i % (beatLen * 2) === 0 || (i + 2) % (beatLen * 2) === 0) {
      return createNote(127, pitch + bassnote.midiNote - MIDI_C5 + offset)
    }
    return createNote()
  },
  [T.RIDE]: (i, pitch, lane, { beatLen, beatInfo: { isFillAccent } }) => {
    const weak = (i + 2) % (beatLen * 2) === 0
    if (isFillAccent(i) && rand(20)) {
      //console.log('fill ride')
      return createNote(randRange(110, 127), pitch)
    }
    if (i % beatLen === 0 || weak) {
      //console.log('yield ride', i, weak)
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

    if (isFillAccent(i) && rand(15)) {
      //console.log('fill kick')
      return createNote(randRange(110, 127), pitch)
    }

    const ret = handlePattern(opts, T.KICK, i, pitch)
    if (ret) {
      return ret
    }
    if ((isBeat(i) || offBeat(i)) && rand(5)) {
      //console.log('yield kick', i)
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
    if (isFillAccent(i) && rand(20)) {
      //console.log('fill snare')
      return createNote(randRange(110, 126), pitch)
    }

    const ret = handlePattern(opts, T.SNARE, i, pitch)
    if (ret) {
      return ret
    }

    const mid = isTriple && (i - 2) % beatLen === 0
    if (
      (offBeat(i) && rand(10)) ||
      (isBeat(i) && rand(5)) ||
      (mid && rand(3))
    ) {
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

export const createBass = (scene, chordLane, style, timeSignature) => {
  const track = T.BASS
  const samples = getSamples(track)
  const pitch = 0
  const iter = iterators[style][track]
    ? iterators[style][track]
    : iterators[track]

  const state = {
    memory: []
  }
  const opts = { ...getOpts(timeSignature), state }

  scene.parts[track] = {
    style,
    samples: samples.map(urlify),
    generator: (function* gen() {
      let currentNote = 0
      currentNote = yield
      while (true) {
        currentNote = yield iter(currentNote, pitch, chordLane, {
          ...opts,
          beatInfo: getBeatInfo(opts)
        })
      }
    })()
  }
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
      //pattern: patterns[i]
      generator: (function* gen() {
        let currentNote = 0
        currentNote = yield
        while (true) {
          currentNote = yield patterns[i][currentNote % chordLane.length]
        }
      })()
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

const getBeatInfo = (opts): IteratorBeatInfo => {
  const { beatLen } = opts
  const isBeat = i => i % beatLen === 0
  const offBeat = i => (i + 2) % beatLen === 0
  const beatsPerBar = i => getBeatsPerBar(i, opts.timeSignature)
  const measure = i => i / (beatsPerBar(i) * beatLen)
  const currentMeasure = i => Math.floor(measure(i)) + 1
  const currentBarProgress = i => 1 - (currentMeasure(i) - measure(i))
  const isStartOfMeasure = i =>
    isBeat(i) && i % (beatsPerBar(i) * beatLen) === 0
  const isFillAccent = i =>
    offBeat(i) && currentMeasure(i) % 4 === 0 && currentBarProgress(i) > 0.9
  return {
    isBeat,
    offBeat,
    isStartOfMeasure,
    isFillAccent,
    beatsPerBar
  }
}

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
  const pitch = 0

  voices.forEach(track => {
    const samples = getSamples(track)
    const iter = iterators[style][track]
      ? iterators[style][track]
      : iterators[track]

    scene.parts[track] = {
      style,
      samples: samples.map(urlify),
      //pattern: patterns[i],
      generator: (function* gen() {
        let currentNote = 0
        currentNote = yield
        while (true) {
          currentNote = yield iter(currentNote, pitch, chordLane, {
            ...opts,
            beatInfo: getBeatInfo(opts)
          })
        }
      })()
    }
  })
}
