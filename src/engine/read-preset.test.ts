import ChordBuilder from './chord-builder/builder'
import ChordParser from './chord-builder/parser'
import presets from './presets'
import { readPreset } from './read-preset'

const parser = new ChordParser()
const builder = new ChordBuilder()

describe('readPreset', () => {
  it('works', () => {
    const value = presets.find(x => x.id === '1').string
    const result = readPreset(value, parser, builder, [4, 4])
    const filtered = result.filter(x => !!x)
    expect(filtered.map(x => x._position)).toEqual([0, 16, 32, 48])
    expect(filtered.map(x => x.name)).toEqual(['C', 'Am', 'Dm7', 'G'])
  })

  it('works, variable time signature', () => {
    const value = presets.find(x => x.id === 'african').string
    const result = readPreset(value, parser, builder, [4, 4])
    const filtered = result
      .filter(x => !!x)
      .filter((_, i, a) => i > a.length - 5)
    expect(filtered.map(x => x._position)).toEqual([40, 48, 56, 68])
    expect(filtered.map(x => x.name)).toEqual(['E/F♯', 'G♯m', 'A', 'C♯m'])
  })

  it('works, empty bar', () => {
    const value = 'Cmaj7; ; Fmaj7; G'
    const result = readPreset(value, parser, builder, [4, 4])
    const filtered = result.filter(x => !!x)
    expect(filtered.map(x => x._position)).toEqual([0, 16, 32, 48])
    expect(filtered.map(x => x.name)).toEqual(['Cmaj7', 'Cmaj7', 'Fmaj7', 'G'])
  })

  it('works, repeated section', () => {
    const value = '[A1] G7; ;A7 [B] C;D [A1]'
    const result = readPreset(value, parser, builder, [4, 4])
    const filtered = result.filter(x => !!x)
    expect(filtered.map(x => x.name)).toEqual([
      'G7',
      'G7',
      'A7',
      'C',
      'D',
      'G7',
      'G7',
      'A7'
    ])
    expect(filtered.map(x => x.section)).toEqual([
      'A1',
      undefined,
      undefined,
      'B',
      undefined,
      'A1',
      undefined,
      undefined
    ])
  })
})
