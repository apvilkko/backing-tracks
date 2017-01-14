import {expect} from 'chai';
import {createEngine} from '../src/engine';

describe('Engine', () => {
  it('should parse chord from text input', () => {
    const engine = createEngine();
    const input = 'C 4 Am7 4 Dm7 4 F/G 2 G 2';
    engine.setSongFromChordInput(input)
    expect(false).to.be.equal(true);
  });
});
