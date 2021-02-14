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
    .replace('h7', 'm7b5')
    .replace('-:', 'b')
    .replace('-', 'b')
    .replace(':', '')
    .replace('min', 'm')
    .replace('m:maj', 'mmaj')
    .replace(/o/g, 'dim')
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

const output = songs.map(song => {
  //console.log(song.title, song.structure, song.sections)
  let outputted = {}
  const data = (!song.structure ? ['A'] : song.structure)
    .map(sect => {
      if (outputted[sect]) {
        return `[${sect}]`
      }
      const out = `[${sect}] ${song.sections[sect]
        .map(bar => {
          return bar
            .map(chord => {
              return chord[0]
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
  return {
    id: song.id,
    name: song.title,
    string: data,
    tempo: 140,
    swing: true
  }
})

fs.writeFileSync('assets/jazzStandards.json', JSON.stringify(output))
