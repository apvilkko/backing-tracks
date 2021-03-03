import ChordParser from './parser'

describe('Parser', () => {
  it('should accept valid chords', () => {
    const parser = new ChordParser()

    expect(parser.parse('F7sus4')).toEqual(true)
    expect(parser.parse('e-7')).toEqual(true)
    expect(parser.parse('Bb#5')).toEqual(true)
    expect(parser.parse('Emaj9/G♯')).toEqual(true)
    expect(parser.parse('A#7#9omit3add13')).toEqual(true)
  })

  it('should not accept invalid chords', () => {
    const parser = new ChordParser()

    expect(parser.parse('J5')).toEqual(false)
    expect(parser.parse(null)).toEqual(false)
    expect(parser.parse('')).toEqual(false)
    expect(parser.parse('A#7#9omt3add13')).toEqual(false)
  })

  it('should set an error describing where the parser failed', () => {
    const parser = new ChordParser()

    expect(parser.parse('FA7sus4')).toEqual(false)
    expect(parser.error instanceof Error).toBe(true)
    expect(parser.error.toString()).toEqual('Error: A')
  })

  it('should normalize the chord presentation string', () => {
    const parser = new ChordParser()

    const verify = (input, output) => {
      parser.parse(input)
      expect(parser.toString()).toEqual(output)
    }
    verify('CM7', 'Cmaj7')
    verify('d7sus4', 'D7sus4')
    verify('dsus', 'Dsus4')
    verify('f7sus', 'F7sus4')
    verify('dsus2', 'Dsus2')
    verify('H7add#11+9', 'B7♯9add♯11')
    verify('Cmb6', 'Cm♭6')
    verify('F9sus', 'F9sus4')
    verify('Cmmaj7', 'Cmmaj7')
  })
})
