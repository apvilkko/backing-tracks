import * as T from './tracks'
import { createPattern, createChords } from './pattern'
import samples from './samples'

const urlify = sample => `samples/${sample}.ogg`

const getSample = track => samples[track]

const createPart = (track, chordLane, style, timeSignature) => {
  const sample = getSample(track)
  return {
    style,
    sample: urlify(sample),
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
    beatLen: Math.round((timeSignature[0] * 4) / timeSignature[1]),
    isTriple: timeSignature[1] === 8
  }
  const keys = [T.BASS, T.RIDE, T.HC, T.SNARE, T.KICK]
  keys.forEach(key => {
    newScene.parts[key] = createPart(key, chordLane, style, timeSignature)
  })
  createChords(
    newScene,
    chordLane,
    T.EPIANO,
    urlify(getSample(T.EPIANO)),
    timeSignature,
    style
  )
  return newScene
}
