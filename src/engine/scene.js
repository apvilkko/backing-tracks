import * as T from './tracks'
import {
  createChords,
  createDrums,
  createBass,
  getSamples,
  urlify
} from './pattern'
import { getBeatLen } from './util'

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
  createBass(newScene, chordLane, style, timeSignature)
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
