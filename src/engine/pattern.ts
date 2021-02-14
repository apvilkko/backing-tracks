import * as T from './tracks'
import { ChordLane } from './types'
import { maybe, rand, randRange } from './util'

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
  [T.RIDE]: (i, pitch, lane, { beatLen }) => {
    const weak = (i + 2) % (beatLen * 2) === 0
    if (i % beatLen === 0 || weak) {
      return createNote(weak ? randRange(64, 90) : 127, pitch)
    }
    return createNote()
  },
  [T.HC]: (i, pitch, label, { beatLen }) => {
    if ((i + beatLen) % (beatLen * 2) === 0) {
      return createNote(127, pitch)
    }
    return createNote()
  },
  [T.KICK]: (i, pitch, label, { beatLen, isTriple }) => {
    const isBeat = i % beatLen === 0
    const offBeat = (i + 2) % beatLen === 0
    if ((isBeat || offBeat) && rand(5)) {
      return createNote(randRange(10, 110), pitch)
    }
    return createNote()
  },
  [T.SNARE]: (i, pitch, label, { beatLen, isTriple }) => {
    const isBeat = i % beatLen === 0
    const offBeat = (i + 2) % beatLen === 0
    const mid = isTriple && (i - 2) % beatLen === 0
    if ((offBeat && rand(10)) || (isBeat && rand(5)) || (mid && rand(3))) {
      return createNote(randRange(10, 110), pitch)
    }
    return createNote()
  }
}

const iteratePattern = ({ patternLength, pitch, chordLane, opts }, iterator) =>
  Array.from({ length: patternLength }).map((_, index) =>
    iterator(index, pitch, chordLane, opts)
  )

const getOpts = timeSignature => ({
  timeSignature,
  isTriple: timeSignature[1] === 8,
  beatLen: Math.round((timeSignature[0] * 4) / timeSignature[1])
})

export const createPattern = ({ track, chordLane, style, timeSignature }) => {
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
      opts: getOpts(timeSignature)
    },
    iter
  )
}

export const createChords = (
  scene,
  chordLane,
  key,
  sample,
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
      sample,
      pattern: patterns[i]
    }
  })
}
