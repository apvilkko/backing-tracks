import * as T from './tracks'
import {
  createPattern,
  createChords,
  createDrums,
  getSamples,
  urlify
} from './pattern'
import { getBeatLen } from './util'

const createPart = (track, chordLane, style, timeSignature) => {
  const samples = getSamples(track)
  return {
    style,
    samples: samples.map(urlify),
    pattern: createPattern({ track, style, chordLane, timeSignature })
  }
}

export const createScene = ({
  tempo,
  shufflePercentage,
  chordLane,
  style,
  timeSignature
}) => {
  const newScene = {
    tempo,
    shufflePercentage,
    parts: {},
    timeSignature,
    beatLen: getBeatLen(timeSignature),
    isTriple: timeSignature[1] === 8
  }
  const keys = [T.BASS]
  keys.forEach(key => {
    newScene.parts[key] = createPart(key, chordLane, style, timeSignature)
  })
  createDrums(newScene, chordLane, timeSignature, style)
  createChords(
    newScene,
    chordLane,
    T.EPIANO,
    getSamples(T.EPIANO).map(urlify),
    timeSignature,
    style
  )
  return newScene
}
