import * as T from './tracks';
import {rand} from './util';

const createNote = (velocity = 0, pitch = null) => ({velocity, pitch});

const getCurrentChord = (lane, i) => {
  if (lane[i]) {
    return lane[i];
  }
  let prev = i - 1;
  while (!lane[prev] && prev > 0) {
    prev--;
  }
  return lane[prev];
};

const getNextChordDistance = (lane, i) => {
  let next = i + 1;
  while (!lane[next] && next < lane.length) {
    next++;
  }
  if (next >= lane.length) {
    return {
      chord: lane[0],
      distance: lane.length - i,
    }
  }
  return {
    chord: lane[next],
    distance: next - i,
  };
};

const MIDI_C5 = 60;
const MIDI_F5 = 65;

const iterators = {
  default: {},
  jazz: {
    [T.BASS]: (i, pitch, lane) => {
      let chord = getCurrentChord(lane, i);
      let bassnote = chord.bass ? chord.bassNote :
        chord.notes.filter(note => note.role === 'root')[0];
      let offset = chord.bass ? 12 : 0;
      const nextChord = getNextChordDistance(lane, i);
      if (i % 4 === 0 && chord.root !== nextChord.chord.root && nextChord.distance <= 5) {
        chord = nextChord.chord;
        bassnote = chord.bass ? chord.bassNote :
          chord.notes.filter(note => note.role === 'root')[0];
        offset = (chord.bass ? 12 : 0) + rand(2) - 1;
        return createNote(127, pitch + bassnote.midiNote - MIDI_C5 + offset);
      } else if ((i + 4) % 8 === 0) {
        const fifth = chord.notes.filter(note => note.role === 'fifth');
        const third = chord.notes.filter(note => note.role === 'third');
        if (fifth && rand(33)) {
          bassnote = fifth[0];
          offset = 0;
        } else if (third && rand(50)) {
          bassnote = third[0];
          offset = 0;
        }
        return createNote(127, pitch + bassnote.midiNote - MIDI_C5 + offset);
      } else if (i % 4 === 0) {
        return createNote(127, pitch + bassnote.midiNote - MIDI_C5 + offset);
      }
      return createNote();
    },
  },
  [T.BASS]: (i, pitch, lane) => {
    const chord = getCurrentChord(lane, i);
    const bassnote = chord.bass ? chord.bassNote :
      chord.notes.filter(note => note.role === 'root')[0];
    const offset = chord.bass ? 12 : 0;
    if (i % 8 === 0 || (i + 2) % 8 === 0) {
      return createNote(127, pitch + bassnote.midiNote - MIDI_C5 + offset);
    }
    return createNote();
  },
  [T.RIDE]: (i, pitch) => {
    if (i % 4 === 0) {
      return createNote(127, pitch);
    }
    return createNote();
  },
  [T.RIMSHOT]: (i, pitch) => {
    if ((i + 4) % 8 === 0) {
      return createNote(127, pitch);
    }
    return createNote();
  }
};

const iteratePattern = ({patternLength, pitch, chordLane}, iterator) =>
  Array.from({length: patternLength}).map((_, index) => iterator(index, pitch, chordLane));

export const createPattern = ({track, chordLane, style}) => {
  const pitch = 0;
  const patternLength = chordLane.length;
  const iter = iterators[style][track] ? iterators[style][track] : iterators[track];
  return iteratePattern({patternLength, pitch, chordLane}, iter);
};

export const createChords = (scene, chordLane, key, sample) => {
  const voices = [1, 2, 3, 4];
  const patterns = voices.map(() =>
    iteratePattern({patternLength: chordLane.length, pitch: 0, chordLane}, () => createNote())
  );
  for (let i = 0; i < chordLane.length; ++i) {
    if (chordLane[i]) {
      let notes = chordLane[i].notes;
      if (notes.length > 4) {
        notes = notes.filter(note => note.role !== 'root');
      }
      notes.forEach((note, j) => {
        if (j <= 3) {
          patterns[j][i] = createNote(127, note.midiNote - MIDI_F5);
        }
      });
    }
  }
  voices.forEach((voice, i) => {
    const voiceKey = `${key}${voice}`;
    scene.parts[voiceKey] = {
      sample,
      pattern: patterns[i],
    };
  });
};
