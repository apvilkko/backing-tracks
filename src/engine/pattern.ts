import * as T from './tracks'
import { ChordLane, ChordLaneChord, Note, TimeSignature } from './types'
import { getBeatLen, rand, randRange, sample } from './util'
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
  let p = index - 2
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

const BASS_LOWEST = 28 // E1

const noteAdjustment = (note: number) => {
  if (note <= BASS_LOWEST + 24) {
    return note + 12
  } else if (note > 75) {
    return note + -12
  }
  return note
}

const withOffset = (noteProps: NoteProps, isBass?: boolean) => {
  let offset = isBass ? 12 : 0
  if (rand(50)) {
    // Change octave
    let jump = rand(50) ? -12 : 12
    const resultingNote = noteProps.note.midiNote + jump + offset
    offset += noteAdjustment(resultingNote) - resultingNote
  }
  //console.log('offset', noteProps.note.midiNote, offset)
  return { ...noteProps, offset }
}

const selectBassNote = (chord: ChordLaneChord, isFirst: boolean): NoteProps => {
  if (chord.bass) {
    const bassNote = chord.bassNote
    return withOffset({ note: bassNote }, true)
  }
  const root = chord.notes.filter(note => note.role === 'root')[0]
  const third = chord.notes.filter(note => note.role === 'third')[0]
  const fifth = chord.notes.filter(note => note.role === 'fifth')[0]
  let note = root
  if (rand(isFirst ? 1 : 20)) {
    if (rand(75)) {
      note = third || root
    } else {
      note = fifth || third || root
    }
  }
  return withOffset({ note })
}

const selectLeadingTone = (
  nextNote: Note,
  nextChord: ChordLaneChord
): NoteProps => {
  let note
  if (rand(75)) {
    note = { midiNote: nextNote.midiNote + (rand(50) ? 1 : -1) }
  } else {
    const nextBn = selectBassNote(nextChord, true)
    note = { midiNote: nextBn.note.midiNote + (rand(50) ? 7 : -5) }
  }

  return { note }
}

type MemItem = { pos: number; chord: ChordLaneChord } & NoteProps

const isWaltz = (ts: TimeSignature) => ts[0] === 9 && ts[1] === 8

const getPrimaryBassNote = (mem: MemItem): Note => {
  if (mem.note) {
    return mem.note
  }
  if (mem.chord) {
    return mem.chord.bass
      ? mem.chord.bassNote
      : mem.chord.notes.filter(note => note.role === 'root')[0]
  }
  return undefined
}

type BassState = {
  memorySet: number | undefined
  memory: Array<MemItem>
}

const walkLines = (
  maj?: boolean,
  dom?: boolean
): Record<string, Array<Array<number>>> => ({
  '5': [
    [2, 3, 4],
    [2, 7, 6],
    [0, 2, maj ? 4 : 3],
    [1, 2, maj ? 4 : 3]
  ],
  '-7': [
    [-2, -3, -5],
    [-2, -4, -6] // alt
  ],
  '7': [
    [2, maj ? 4 : 3, 5],
    [maj ? 4 : 3, 5, 6]
  ],
  '-5': [
    [-1, -2, -3],
    [dom ? -2 : -1, -3, -4]
  ]
})

const sameLines = (fifth: number, maj?: boolean, dom?: boolean) => {
  const th = maj ? 4 : 3
  const sv = dom ? -2 : -1
  const sx = maj ? -3 : -4
  return [
    [th, th - 1, th],
    [2, th, 2],
    [0, th, fifth],
    [0, fifth, fifth],
    [sv, sx, fifth],
    [0, 2, 2],
    [fifth, 12, fifth]
  ]
}

const isMajor = (chord: ChordLaneChord) => {
  if (chord.quality === 'm' || chord.quality === 'dim') {
    return false
  }
  return true
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
        const chordPositions: Record<number, boolean> = {}
        for (let c = 0; c < nextChords.length; ++c) {
          const nc = nextChords[c].chord
          const pos = nextChords[c].at
          const laneIndex = pos % lane.length
          const isFirst = laneIndex === 0 || !!lane[laneIndex]?.section
          const noteProps = selectBassNote(nc, isFirst)
          chordPositions[pos] = true
          state.memory.push({ pos, chord: nc, ...noteProps })
        }

        // Check for chord staying the same
        let startingLength = state.memory.length
        for (let c = 0; c < startingLength; ++c) {
          const mem = state.memory[c]
          const nextIndex = c + 1
          const nextMem =
            state.memory[
              nextIndex < startingLength ? nextIndex : state.memory.length
            ]
          if (mem && nextMem && mem.chord.name === nextMem.chord.name) {
            const numBeats = Math.floor((nextMem.pos - (mem.pos + 1)) / beatLen)
            if (numBeats === 3 && rand(75)) {
              const isMaj = isMajor(mem.chord)
              let fifth = 7
              if (mem.chord.quality === 'dim' || mem.chord.quality === 'alt') {
                fifth--
              } else if (mem.chord.quality === 'aug') {
                fifth++
              }
              const pattern = sample(
                sameLines(fifth, isMaj, mem.chord.quality !== 'maj')
              )
              for (let x = 0; x < numBeats; ++x) {
                const newNote = {
                  pos: mem.pos + beatLen * (x + 1),
                  note: {
                    midiNote: noteAdjustment(mem.note.midiNote + pattern[x])
                  },
                  chord: mem.chord
                }
                state.memory.push(newNote)
              }
            }
          }
        }
        state.memory = sortMemory(state.memory)

        // Check for 4th/5th movements or possible repeats in descending/ascending lines
        startingLength = state.memory.length
        for (let c = 0; c < startingLength; ++c) {
          const mem = state.memory[c]
          const nextIndex = c + 1
          const nextMem =
            state.memory[
              nextIndex < startingLength ? nextIndex : state.memory.length
            ]
          if (mem && nextMem) {
            const numBeats = Math.floor((nextMem.pos - (mem.pos + 1)) / beatLen)
            const noteDifference =
              getPrimaryBassNote(nextMem).midiNote -
              getPrimaryBassNote(mem).midiNote
            const noteDiff = Math.abs(noteDifference) % 12
            if (
              numBeats === 3 &&
              (noteDiff === 7 || noteDiff === 5) &&
              mem.note.role === 'root' &&
              nextMem.note.role === 'root' &&
              rand(50)
            ) {
              const isMaj = isMajor(mem.chord)
              const pattern = sample(
                walkLines(isMaj, mem.chord.quality !== 'maj')[
                  String(noteDifference)
                ]
              )
              for (let x = 0; x < numBeats; ++x) {
                const newNote = {
                  pos: mem.pos + beatLen * (x + 1),
                  note: {
                    midiNote: noteAdjustment(mem.note.midiNote + pattern[x])
                  },
                  chord: mem.chord
                }
                state.memory.push(newNote)
              }
            } else if (
              numBeats === 1 &&
              rand(75) &&
              (noteDiff === 1 ||
                noteDiff === 2 ||
                noteDiff === 10 ||
                noteDiff === 11)
            ) {
              // Repeat, or change octave
              const jump = rand(50) ? 12 : -12
              const offset = rand(5) ? jump : 0
              const pos = mem.pos + beatLen
              if (pos % beatLen === 0) {
                const midiNote = noteAdjustment(mem.note.midiNote + offset)
                const newNote = {
                  pos,
                  note: { midiNote },
                  chord: mem.chord
                }
                state.memory.push(newNote)
              }
            }
          }
        }
        state.memory = sortMemory(state.memory)

        // Place leading tones
        startingLength = state.memory.length
        for (let c = 0; c < startingLength; ++c) {
          const mem = state.memory[c]
          const pos = mem.pos - beatLen
          if (
            !chordPositions[pos] &&
            pos % lane.length >= i &&
            pos % beatLen === 0
          ) {
            const noteProps = selectLeadingTone(mem.note, mem.chord)
            state.memory.push({ pos, chord: mem.chord, ...noteProps })
          }
        }
        state.memory = sortMemory(state.memory)

        // Fill out gaps
        startingLength = state.memory.length
        for (let c = 0; c < startingLength; ++c) {
          const mem = state.memory[c]
          const nextIndex = c + 1
          const nextMem =
            state.memory[
              nextIndex < startingLength ? nextIndex : state.memory.length
            ]
          if (mem && nextMem) {
            const numBeats = Math.floor((nextMem.pos - (mem.pos + 1)) / beatLen)
            const noteDifference = nextMem.note.midiNote - mem.note.midiNote
            const noteDiff = Math.abs(noteDifference)
            const semitoneStep = noteDiff === numBeats + 1
            if (numBeats && semitoneStep) {
              // direct chromatic walk possible
              for (let x = 0; x < numBeats; ++x) {
                const newNote = {
                  pos: mem.pos + beatLen * (x + 1),
                  note: {
                    midiNote: noteAdjustment(
                      mem.note.midiNote +
                        (x + 1) * (noteDifference > 1 ? 1 : -1)
                    )
                  }
                }
                state.memory.push(newNote)
              }
            } else {
              for (let x = 0; x < numBeats; ++x) {
                const newNote = {
                  pos: mem.pos + beatLen * (x + 1),
                  note: sample(
                    mem.chord.notes.filter(x =>
                      ['root', 'third', 'fifth'].includes(x.role)
                    )
                  )
                }
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

      return createNote()
    }
  },
  [T.BASS]: (i, pitch, lane, { beatLen }) => {
    const chord = getCurrentChord(lane, i)
    if (chord) {
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
    }
    return createNote()
  },
  [T.RIDE]: (
    i,
    pitch,
    lane,
    { beatLen, timeSignature, beatInfo: { isFillAccent } }
  ) => {
    let weak = (i + 2) % (beatLen * 2) === 0
    if (isWaltz(timeSignature)) {
      weak = (i + 2) % (beatLen * 3) === 0
    }
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
    let hit = (i + beatLen) % (beatLen * 2) === 0
    if (isWaltz(opts.timeSignature)) {
      hit = (i + beatLen) % (beatLen * 3) === 2 * beatLen
    }
    if (hit) {
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

const bassMemStore = {
  state: { memory: [] }
}

export const clearBassMemory = () => {
  bassMemStore.state.memory = []
  bassMemStore.state.memorySet = undefined
}

export const createBass = (scene, chordLane, style, timeSignature) => {
  const track = T.BASS
  const samples = getSamples(track)
  const pitch = 0
  const iter = iterators[style][track]
    ? iterators[style][track]
    : iterators[track]

  const state = bassMemStore.state
  clearBassMemory()
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
