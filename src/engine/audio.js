import {
  init,
  start,
  setScene,
  createMixer,
  play,
  pause,
  isPlaying,
  setSeqLength,
  reset as seqReset
} from './stateful-web-audio'
import * as T from './tracks'
import { createScene } from './scene'

export const newScene = (ctx, opts) => {
  const scene = createScene(opts)
  setSeqLength(ctx, opts.chordLane.length)
  setScene(ctx, scene)
}

export const toggle = (ctx, state) => {
  const playing = typeof state === 'boolean' ? !state : isPlaying(ctx)
  if (playing) {
    pause(ctx)
  } else {
    play(ctx)
  }
  return !playing
}

export const reset = ctx => {
  seqReset(ctx)
}

const pGain = 0.1

export const initCtx = () => {
  const ctx = init()
  createMixer(ctx, {
    [T.KICK]: { gain: 0.8 },
    [T.SNARE]: { gain: 0.9 },
    //[T.RIMSHOT]: { gain: 0.5 },
    [T.BASS]: { gain: 0.6 },
    [T.HC]: { gain: 0.7 },
    [T.RIDE]: { gain: 0.7 },
    [`${T.EPIANO}1`]: { gain: pGain },
    [`${T.EPIANO}2`]: { gain: pGain },
    [`${T.EPIANO}3`]: { gain: pGain },
    [`${T.EPIANO}4`]: { gain: pGain }
  })
  start(ctx)
  return ctx
}
