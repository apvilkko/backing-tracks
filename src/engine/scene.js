import * as T from './tracks';
import {createPattern, createChords} from './pattern';
import samples from './samples';

const urlify = sample => `samples/${sample}.ogg`;

const getSample = track => samples[track];

const createPart = (track, chordLane, style) => {
  const sample = getSample(track);
  return {
    style,
    sample: urlify(sample),
    pattern: createPattern({track, style, chordLane}),
  };
};

export const createScene = ({tempo, shufflePercentage, chordLane, style}) => {
  const newScene = {
    tempo,
    shufflePercentage,
    parts: {}
  };
  const keys = [T.BASS, T.RIDE, T.RIMSHOT];
  keys.forEach(key => {
    newScene.parts[key] = createPart(key, chordLane, style);
  });
  createChords(newScene, chordLane, T.EPIANO, urlify(getSample(T.EPIANO)));
  return newScene;
};
