const fs = require('fs')
const path = require('path')

// read **kern format files from corpus
// https://figshare.com/articles/dataset/iRealPro_Corpus_of_Jazz_Standards/10326725
// argument should be dir with the *.jazz files

const cleanBassNote = x => x.replace('-', 'b')

const convertChord = x => {
  const alternates = x.split('(')
  if (alternates.length > 1) {
    return `${convertChord(alternates[0])}(${convertChord(alternates[1])}`
  }
  const parts = x.split('/')
  if (parts.length > 1) {
    return `${convertChord(parts[0])}/${cleanBassNote(parts[1])}`
  }
  return parts[0]
    .replace('^9', 'maj9')
    .replace('^7', 'maj7')
    .replace('^', 'maj')
    .replace('h7', 'm7b5')
    .replace('-:', 'b')
    .replace('-', 'b')
    .replace(':', '')
    .replace('min', 'm')
    .replace('m:maj', 'mmaj')
    .replace(/o/g, 'dim')
    .replace('r', '')
}

let DEBUG = false
const log = (...x) => (DEBUG ? console.log(...x) : {})

const getDebug = () => false
//const getDebug = s => s.id === 'halfnelson'

const files = fs.readdirSync(process.argv[2]).filter(x => x.endsWith('.jazz'))
const songs = files.map(filename => {
  const data = fs
    .readFileSync(path.resolve(process.argv[2], filename))
    .toString()
    .split('\n')
  const song = { sections: {}, id: filename.replace('.jazz', '') }
  let currentSection = null
  let currentBar = []
  let tsRead = false
  DEBUG = getDebug(song)
  data.forEach(line => {
    if (line.startsWith('!') && line.indexOf('!OTL') > -1) {
      song.title = line
        .split(':')
        .slice(1)
        .join('')
        .trim()
    } else if (line.startsWith('*>[')) {
      song.structure = line
        .substring(3)
        .replace(']', '')
        .split(',')
        .filter(x => x !== 'Sign') // TODO handle D.S. etc
    } else if (line.startsWith('*>')) {
      const sect = line.substring(2)
      // TODO handle D.S. etc
      if (sect !== 'Sign') {
        currentSection = sect
      }
    } else if (line.startsWith('*M') && !tsRead) {
      // song might have time signature changes
      song.timeSignature = line.substring(2)
      tsRead = true
    } else if (line.startsWith('*') && line.endsWith(':')) {
      song.key = line.substring(1, line.length - 1)
    } else if (line.startsWith('=')) {
      if (currentSection === null) {
        currentSection = 'A'
      }
      if (!song.sections[currentSection]) {
        song.sections[currentSection] = []
      }
      song.sections[currentSection].push(currentBar)
      currentBar = []
    } else if (line[0] >= '1' && line[0] <= '9') {
      const dotted = line[1] === '.'
      const duration = dotted ? line.substring(0, 2) : line[0]
      const chord = convertChord(line.substring(dotted ? 2 : 1))
      currentBar.push([chord, duration])
    }
  })
  // check empty sections
  if (song.structure) {
    song.structure.forEach(sect => {
      if (!song.sections[sect]) {
        song.sections[sect] = []
      }
    })
  }
  log(song)
  return song
})

/*console.log(
  songs
    .filter(x => x.timeSignature !== '4/4' && x.timeSignature !== '3/4')
    .map(x => [x.title, x.timeSignature])
)*/

const addendum = [
  {
    id: 'dolphindance2',
    name: 'Dolphin Dance v2',
    string:
      '[B2] Bbm7/Eb;Ebmaj7;Abmaj7#5/Eb;Dm7b5 G7b9 [A] Cm7;Abmaj7;Cm7;Am7 D7;Gmaj7;Abm7 Db7;Fm7;Bb7;Cm7;Cm7/Bb;Am7;D7 [B1] Gmaj7;Fmaj7/G;A/G;Cmmaj7/G;F9sus;Cmmaj7/F;F9sus;Em7 A7;Eb7;Am7 D7;Bm7;E7 Dm7;C#m7;F#7;Bm7/E;Am7/E;Bm7/E;Am7/E',
    swing: true,
    tempo: 118
  }
]

const sorted = arr => {
  arr.sort((s1, s2) => {
    const a = s1.name.toUpperCase()
    const b = s2.name.toUpperCase()
    if (a < b) return -1
    if (a > b) return 1
    return 0
  })
  return arr
}

const output = sorted(
  songs
    .map(song => {
      //console.log(song.title, song.structure, song.sections)
      let outputted = {}
      const data = (!song.structure ? ['A'] : song.structure)
        .map(sect => {
          if (outputted[sect]) {
            return `[${sect}]`
          }
          const out = `[${sect}] ${song.sections[sect]
            .map(bar => {
              const durations = new Set(bar.map(x => x[1]))
              const multiLen = durations.size > 1
              return bar
                .map(chord => {
                  return multiLen && chord[1] !== '4'
                    ? `${chord[0]} .`
                    : chord[0]
                })
                .join(' ')
            })
            .join(';')}`
          outputted[sect] = true
          return out
        })
        .join(' ')
      DEBUG = getDebug(song)
      log(data)
      const out = {
        id: song.id,
        name: song.title,
        string: data,
        tempo: 140,
        swing: true
      }
      if (song.timeSignature !== '4/4') {
        // one song in corpus has 3/2. time signature, correct to 3/4
        out.ts = song.timeSignature.replace('2.', '4')
      }
      return out
    })
    .concat(addendum)
)

fs.writeFileSync('assets/jazzStandards.json', JSON.stringify(output))
