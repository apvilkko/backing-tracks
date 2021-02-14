import type { Chord, ChordLane, TimeSignature } from "./types"

type ChordWrapper = {
  chord: Chord
  duration: number
}

const getNextToken = (str: string) => {
  let endIndex = str.indexOf(' ')
  let endIndex2 = str.indexOf(';')
  let index
  if (endIndex === -1 && endIndex2 === -1) {
    index = str.length
  } else {
    if (endIndex === -1) {
      index = endIndex2
    } else if (endIndex2 === -1) {
      index = endIndex
    } else {
      index = Math.min(endIndex, endIndex2)
    }
  }
  return str.substring(0, index)
}

const getBeatsPerBar = (ts : TimeSignature) => Math.round(ts[0] / (ts[1] === 8 ? 3 : 1))

const readPreset = (value: string, parser, builder, timeSignature: TimeSignature) => {
  const chordLane : ChordLane = []
  let beatsPerBar = getBeatsPerBar(timeSignature)

  let chords: Array<ChordWrapper> = []
  let pos = 0;
  let currentSection = ''
  let tokens = [];
  let sections = {}
  let prevWasBarLine = false
  while (pos <= value.length) {
    const c = pos < value.length ? value[pos] : null
    let handled = false
    //console.log('c', c)
    const sectionStart = c === '['
    const barLine = c === ';'
    let shouldFinish = false
    if (sectionStart && tokens.length) {
      shouldFinish = true
    }
    if (sectionStart && !shouldFinish) {
      const section = value.substring(pos).match(/\[([^\s\]]+)\]/)
      if (!section) {
        throw new Error('invalid section at pos' + pos)
      }
      const newSection = section[1]
      if (sections[currentSection]) {
        sections[currentSection].end = chords.length
      }
      //console.log('newSection', newSection, currentSection)
      currentSection = newSection
      if (!sections[currentSection]) {
        sections[currentSection] = {start: chords.length}
      } else {
        // Repeated section
        const {start, end} = sections[currentSection]
        chords = chords.concat(chords.slice(start, end))
      }
      pos += section[0].length
      handled = true
    } else if (shouldFinish || barLine || c === null) {
      const chordsPerBar = tokens.length === 0 ? 1 : tokens.length
      const duration = beatsPerBar / chordsPerBar
      //console.log('tokens', tokens, shouldFinish, c)
      if (tokens.length === 0 && prevWasBarLine) {
        //console.log('repeating last', shouldFinish, c)
        // empty bar, repeat last
        const lastChord = chords[chords.length -1]
        chords.push({...lastChord, duration})
      }
      for (let i = 0; i < tokens.length; ++i) {
        const t = tokens[i]
        //console.log('process token', t)
        if (t === 'same') {
          chords[chords.length - 1].duration += duration
        } else {
          // disregard alternate chords
          parser.parse(t.replace(/\([^)]+\)/, ''))
          builder.buildChord(parser.model)
          //console.log('builder model', t, builder.model)
          chords.push({
            chord: {...builder.model, name: parser.toString()},
            duration
          })
        }
      }
      tokens = []
      if (!shouldFinish) {
        pos++;
      } else {
        shouldFinish = false
      }
      handled = true
    } else if (c === '!') {
      const token = getNextToken(value.substring(pos)).replace('!','')
      const ts = token.split('/').map(Number)
      if (ts.length !== 2 || isNaN(ts[0]) || isNaN(ts[1])) {
        throw new Error('invalid time signature at ' + pos + '; ' + token)
      }
      beatsPerBar = getBeatsPerBar(ts)
      pos += (token.length + 1)
      handled = true
    } else if (c !== ' ') {
      let token = getNextToken(value.substring(pos))
      let tlen = token.length
      if (token === '.') {
        token = 'same'
        tlen = 1
      }
      //console.log('chord token', token)
      tokens.push(token)
      pos += tlen
      handled = true
    }
    if (!handled) {
      pos++
    } else {
      prevWasBarLine = barLine
    }
  }

  const beatLength = Math.round((4 * timeSignature[0]) / timeSignature[1])
  chords.forEach(item => {
    for (let i = 0; i < item.duration * beatLength; ++i) {
      chordLane.push(
        i === 0 ? { ...item.chord, _position: chordLane.length } : undefined
      )
    }
  })
  return chordLane
}

export { readPreset }
