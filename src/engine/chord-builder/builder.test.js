import map from 'lodash/fp/map'
import ChordParser from './parser'
import ChordBuilder from './builder'

const verify = (expected, notes) =>
  expect(map('vexNote')(notes)).toEqual(expected)

describe('Builder', () => {
  it('should set notes for Vex', () => {
    const parser = new ChordParser()
    const builder = new ChordBuilder()
    parser.parse('bm7')
    builder.buildChord(parser.model)
    const expected = ['B/3', 'D/4', 'F#/4', 'A/4']
    const vexNotes = map('vexNote')(parser.model.notes)
    expect(vexNotes).toEqual(expected)
  })

  it('should set midi notes', () => {
    const parser = new ChordParser()
    const builder = new ChordBuilder()
    parser.parse('Ebmaj7')
    builder.buildChord(parser.model)
    const expected = [63, 67, 70, 74]
    const notes = map('midiNote')(parser.model.notes)
    expect(notes).toEqual(expected)
  })

  it('should build jazz voicings', () => {
    const parser = new ChordParser()
    const builder = new ChordBuilder()

    parser.parse('Ebmaj7')
    builder.buildChord(parser.model)
    verify(['D/4', 'F/4', 'G/4', 'Bb/4'], parser.model.voicing)

    parser.parse('F#m7')
    builder.buildChord(parser.model)
    verify(['E/4', 'G#/4', 'A/4', 'C#/5'], parser.model.voicing)

    parser.parse('Bb7')
    builder.buildChord(parser.model)
    verify(['D/4', 'G/4', 'Ab/4', 'C/5'], parser.model.voicing)
  })

  /*it('should handle guitar chords', () => {
    const parser = new ChordParser()
    const builder = new ChordBuilder()

    parser.parse('E')
    builder.buildChord(parser.model)
    expect(parser.model.guitar).toEqual('0-2-2-1-0-0')

    parser.parse('dsus4')
    builder.buildChord(parser.model)
    expect(parser.model.guitar).toEqual('x-x-0-2-3-3')

    parser.parse('A')
    builder.buildChord(parser.model)
    expect(parser.model.guitar).toEqual('x-0-2-2-2-0')

    parser.parse('Asus2')
    builder.buildChord(parser.model)
    expect(parser.model.guitar).toEqual('x-0-2-2-0-0')

    parser.parse('Asus4')
    builder.buildChord(parser.model)
    expect(parser.model.guitar).toEqual('x-0-2-2-3-0')

    parser.parse('g#maj7')
    builder.buildChord(parser.model)
    expect(parser.model.guitar).toEqual('4-x-1-1-1-3')
  })*/

  it('should handle a bunch of chords', () => {
    const parser = new ChordParser()
    const builder = new ChordBuilder()

    parser.parse('Eadd2')
    builder.buildChord(parser.model)
    verify(['E/4', 'F#/4', 'G#/4', 'B/4'], parser.model.notes)

    parser.parse('E')
    builder.buildChord(parser.model)
    verify(['E/4', 'G#/4', 'B/4'], parser.model.notes)

    parser.parse('dsus4')
    builder.buildChord(parser.model)
    verify(['D/4', 'G/4', 'A/4'], parser.model.notes)

    parser.parse('A')
    builder.buildChord(parser.model)
    verify(['A/3', 'C#/4', 'E/4'], parser.model.notes)

    parser.parse('Asus2')
    builder.buildChord(parser.model)
    verify(['A/3', 'B/3', 'E/4'], parser.model.notes)

    parser.parse('Asus4')
    builder.buildChord(parser.model)
    verify(['A/3', 'D/4', 'E/4'], parser.model.notes)

    parser.parse('gbm7')
    builder.buildChord(parser.model)
    verify(['Gb/4', 'Bbb/4', 'Db/5', 'Fb/5'], parser.model.notes)

    parser.parse('Bsus4')
    builder.buildChord(parser.model)
    verify(['B/3', 'E/4', 'F#/4'], parser.model.notes)

    parser.parse('g#sus2')
    builder.buildChord(parser.model)
    verify(['G#/4', 'A#/4', 'D#/5'], parser.model.notes)

    parser.parse('C7sus')
    builder.buildChord(parser.model)
    verify(['C/4', 'F/4', 'G/4', 'Bb/4'], parser.model.notes)

    parser.parse('C9sus4')
    builder.buildChord(parser.model)
    verify(['C/4', 'F/4', 'G/4', 'Bb/4', 'D/5'], parser.model.notes)

    parser.parse('C7b9#11')
    builder.buildChord(parser.model)
    verify(['C/4', 'E/4', 'G/4', 'Bb/4', 'Db/5', 'F#/5'], parser.model.notes)

    parser.parse('Bb13')
    builder.buildChord(parser.model)
    verify(
      ['Bb/3', 'D/4', 'F/4', 'Ab/4', 'C/5', 'Eb/5', 'G/5'],
      parser.model.notes
    )

    parser.parse('Eadd4/F#')
    builder.buildChord(parser.model)
    expect(parser.model.bassNote.vexNote).toEqual('F#/3')
    verify(['E/4', 'G#/4', 'A/4', 'B/4'], parser.model.notes)

    parser.parse('Gadd9')
    builder.buildChord(parser.model)
    verify(['G/4', 'A/4', 'B/4', 'D/5'], parser.model.notes)

    parser.parse('Cmb6')
    builder.buildChord(parser.model)
    verify(['C/4', 'Eb/4', /*'Ab/4'*/ 'G#/4'], parser.model.notes)
  })
})
