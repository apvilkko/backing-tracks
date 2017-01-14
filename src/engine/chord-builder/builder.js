import each from 'lodash/fp/each';
import filter from 'lodash/fp/filter';
import find from 'lodash/fp/find';
import findIndex from 'lodash/fp/findIndex';
import flow from 'lodash/fp/flow';
import head from 'lodash/fp/head';
import identity from 'lodash/fp/identity';
import invertBy from 'lodash/fp/invertBy';
import map from 'lodash/fp/map';
import sortBy from 'lodash/fp/sortBy';


const NOTES = {
  'B#': 0,
  C: 0,
  Dbb: 0,
  'C#': 1,
  Db: 1,
  D: 2,
  Ebb: 2,
  'C##': 2,
  'D#': 3,
  Eb: 3,
  E: 4,
  'D##': 4,
  Fb: 4,
  'E#': 5,
  F: 5,
  Gbb: 5,
  'F#': 6,
  Gb: 6,
  G: 7,
  Abb: 7,
  'F##': 7,
  'G#': 8,
  Ab: 8,
  A: 9,
  'G##': 9,
  Bbb: 9,
  'A#': 10,
  Bb: 10,
  B: 11,
  'A##': 11,
  Cb: 11,
};

const INVERTED_NOTES = invertBy(identity, NOTES);

const ROOTS = {
  C: 0,
  D: 1,
  E: 2,
  F: 3,
  G: 4,
  A: 5,
  B: 6,
};

const toSmallestInterval = val => {
  let note = val;
  while (note > 11) {
    note -= 12;
  }
  return note;
};

function absToNote(absNote, originalRoot, rd, quality, role) {
  const choices = INVERTED_NOTES[toSmallestInterval(absNote)];
  return flow(
    filter(item => {
      let rootDistance = ROOTS[item[0]] - ROOTS[originalRoot];
      if (rootDistance < 0) {
        rootDistance += 7;
      }
      const fifth = (rd >= 6 && rd <= 8) && rootDistance === 4;
      const seventh = (rd >= 10 && rd <= 11) && rootDistance === 6;
      const ninth = (rd >= 13 && rd <= 15) && rootDistance === 1;
      const eleventh = (rd >= 17 && rd <= 18) && rootDistance === 3;
      const thirteenth = (rd >= 20 && rd <= 21) && rootDistance === 5;
      const dimSeventh = (rd === 9) && rootDistance === 6 && quality === 'dim';
      const sixth = (rd >= 8 && rd <= 9) && rootDistance === 5 &&
        quality !== 'dim' && quality !== 'aug';
      const third = (rd >= 3 && rd <= 4) && rootDistance === 2;
      const second = (rd >= 1 && rd <= 2) && rootDistance === 1;
      const fourth = (rd >= 5 && rd <= 6) && rootDistance === 3 &&
        quality !== 'dim' && role !== 'fifth';
      return fifth || third || fourth || sixth || seventh || dimSeventh ||
        second || ninth || eleventh || thirteenth;
    }),
    head,
  )(choices);
}

const getAbsNote = (root, acc) => NOTES[`${root}${acc || ''}`];

function getDistance(from, to) {
  const a = NOTES[from];
  const b = getAbsNote(to.note, to.accidental);
  return b >= a ? (b - a) : (b - a + 12);
}

function getNote(model, distance, role) {
  const root = model.root;
  const acc = model.rootModifier;
  const absNote = getAbsNote(root, acc);
  const newNote = absNote + distance;
  let newClean = absToNote(newNote, root, distance, model.quality, role);
  if (!newClean && distance === 0) {
    newClean = model.root + (model.rootModifier ? model.rootModifier : '');
  }
  if (!newClean) {
    throw new Error(`bad note ${root} ${acc} ${distance} ${role}`);
  }
  return {
    note: newClean[0],
    accidental: newClean.length > 1 ? newClean.substr(1) : null,
    role,
  };
}

const INTERVAL = {
  2: 2,
  4: 5,
  5: 7,
  9: 14,
  11: 17,
};

const getSeventh = model => (model.quality === 'maj' ? 11 : 10);

const adjustWithAccidental = (value, accidental) => {
  switch (accidental) {
    case '#':
      return value + 1;
    case 'b':
      return value - 1;
    case 'bb':
      return value - 2;
    case '##':
      return value + 2;
    default:
      return value;
  }
};

const getExtraNote = (note, chord) => getNote(
  chord,
  adjustWithAccidental(INTERVAL[note.interval], note.accidental),
  note.interval,
);

const isSuitableForGuitarString = (note, stringNumber) => {
  if (stringNumber <= 1) {
    return note.role === 'root' || (note.role === 'fifth');
  }
  return true;
};

const toMidiNote = note => adjustWithAccidental(
  12 + (note.octave * 12) + NOTES[note.note],
  note.accidental,
);

const octaveChanged = (a, b) => NOTES[b] - NOTES[a] < 0;

const formatNote = (note, acc, octave) => `${note}${acc}/${octave}`;

const defaultConfig = {
  freeStrings: ['E', 'A', 'D', 'G', 'B', 'E'],
  fretSpread: 4,
  fretPosition: 1,
};

class ChordBuilder {
  constructor(config) {
    this.config = Object.assign({}, defaultConfig, config || {});
  }

  buildChord(model) {
    this.model = model;
    const notes = [];
    if (this.model.root) {
      notes.push(getNote(this.model, 0, 'root'));
      let third = 4;
      if (this.model.quality === 'm' || this.model.quality === 'dim') {
        third = 3;
      } else if (this.model.quality === 'sus') {
        third = null;
        const susInt = this.model.susInterval || this.model.interval;
        if (susInt === 2) {
          third = 2;
        } else if (susInt === 4) {
          third = 5;
        }
      }
      if (third && this.model.quality !== 'power') {
        notes.push(getNote(this.model, third, 'third'));
      }
      let fifth = 7;
      if (this.model.quality === 'dim') {
        fifth = 6;
      } else if (this.model.quality === 'aug') {
        fifth = 8;
      }
      if (fifth) {
        const isFifth = item => item.interval === 5;
        const fifthModified = find(isFifth)(this.model.extra);
        if (fifthModified) {
          fifth = adjustWithAccidental(fifth, fifthModified.accidental);
        }
        notes.push(getNote(this.model, fifth, 'fifth'));
      }
      const interval = this.model.interval;
      if (interval) {
        let realInterval;
        if (interval === 7) {
          realInterval = getSeventh(this.model);
          if (this.model.quality === 'dim') {
            realInterval--;
          }
        } else if (interval === 6) {
          realInterval = 9;
        } else if (interval === 9) {
          // add also 7 to 9 chord
          realInterval = 14;
          notes.push(getNote(this.model, getSeventh(this.model), 'seventh'));
        } else if (interval === 11) {
          // add also 7 & 9 to 11 chord
          realInterval = 17;
          notes.push(getNote(this.model, getSeventh(this.model), 'seventh'));
          notes.push(getNote(this.model, 14, 'ninth'));
        } else if (interval === 13) {
          // add also 7 & 9 & 11 to 13 chord
          realInterval = 21;
          notes.push(getNote(this.model, getSeventh(this.model), 'seventh'));
          notes.push(getNote(this.model, 14, 'ninth'));
          notes.push(getNote(this.model, 17, 'eleventh'));
        }
        if (realInterval) {
          notes.push(getNote(this.model, realInterval, 'interval'));
        }
      }
      each(item => {
        const isAdd = item.action === 'add' || item.action === 'iadd';
        if (isAdd && item.interval !== 5) {
          const extraNote = getExtraNote(item, model);
          const isSecond = item.interval === 9 || item.interval === 2;
          if (item.action === 'add' && item.interval === 4) {
            const hasThird = findIndex({role: 'third'})(notes);
            const pos = hasThird ? hasThird + 1 : 1;
            notes.splice(pos, 0, extraNote);
          } else if (item.action === 'add' && isSecond) {
            notes.splice(1, 0, extraNote);
          } else {
            notes.push(extraNote);
          }
        }
      })(this.model.extra);
    }
    this.model.notes = notes;
    if (notes.length > 0) {
      this.setMidiNotes();
    }
    this.buildGuitarChord();
  }
  setMidiNotes() {
    let octave = 3;
    const notes = this.model.notes;
    let lastNote = notes[0].note;
    for (let i = 0; i < notes.length; ++i) {
      const acc = notes[i].accidental ? notes[i].accidental : '';
      if (i === 0 && notes[i].note !== 'A' && notes[i].note !== 'B') {
        octave = 4;
      }
      if (octaveChanged(lastNote, notes[i].note)) {
        octave++;
      }
      notes[i].octave = octave;
      notes[i].vexNote = formatNote(notes[i].note, acc, octave);
      notes[i].midiNote = toMidiNote(notes[i]);
      lastNote = notes[i].note;
    }
    if (this.model.bass) {
      octave = (this.model.bass === 'A' || this.model.bass === 'B') ? 2 : 3;
      this.model.bassNote = {
        note: this.model.bass,
        accidental: this.model.bassModifier,
        octave,
        vexNote: formatNote(this.model.bass,
          this.model.bassModifier ? this.model.bassModifier : '', octave),
      };
      this.model.bassNote.midiNote = toMidiNote(this.model.bassNote);
    }
  }
  buildGuitarChord() {
    const freeStrings = this.config.freeStrings;
    const fretSpread = parseInt(this.config.fretSpread, 10);
    const fretPosition = parseInt(this.config.fretPosition, 10);
    const notes = this.model.notes;

    const emptyTab = index => ({tab: 'x', note: null, index});

    const tab = map(emptyTab)(freeStrings);
    // Set possible free strings first
    for (let i = 0; i < notes.length; ++i) {
      const note = notes[i];
      if (!note.accidental) {
        for (let j = 0; j < freeStrings.length; ++j) {
          if (!isSuitableForGuitarString(note, j)) {
            continue;
          }
          if (freeStrings[j] === note.note) {
            tab[j] = {tab: 0, note, index: j};
          }
        }
      }
    }

    const assignString = (j, chord, onlyMainNotes) => {
      const freeNote = freeStrings[j];
      // console.log("freeNote", freeNote);
      const smallestDistance = flow(
        map(note => {
          const distance = getDistance(freeNote, note) +
            (isSuitableForGuitarString(note, j) ? 0 : 36) +
            ((onlyMainNotes &&
              (note.role !== 'root' && note.role !== 'fifth')) ? 36 : 0);
          return {distance, note};
        }),
        filter(item => item.distance >= fretPosition &&
          (fretPosition + fretSpread) > item.distance),
        sortBy(item => item.distance),
        head,
      )(chord);
      // console.log(smallestDistance);
      if (smallestDistance) {
        tab[j] = {
          tab: smallestDistance.distance,
          note: smallestDistance.note,
          index: j,
        };
      }
    };

    for (let j = 0; j < tab.length; ++j) {
      if (tab[j].tab === 'x') {
        assignString(j, notes);
      }
    }

    // try to make root note the lowest string
    const notMute = item => item.tab !== 'x';

    function clearNonRoots() {
      const lowest = findIndex(notMute)(tab);
      flow(
        filter(item => notMute(item) &&
          item.index === lowest && item.note.role !== 'root'),
        map('index'),
        each(index => {
          tab[index] = emptyTab();
        }),
      )(tab);
    }
    clearNonRoots();
    clearNonRoots();

    // try to remove double thirds
    const isThird = item => item.note && item.note.role === 'third';
    const thirds = filter(isThird)(tab);
    if (thirds.length > 1) {
      // leave the highest
      thirds.pop();
      each(item => {
        tab[item.index] = emptyTab();
        assignString(item.index, notes, true);
      })(thirds);
    }

    // console.log(tab);
    this.model.guitar = map('tab')(tab).join('-');
  }
}

export default ChordBuilder;
