import { getContext } from './util'
import { playSample, triggerEnvelope } from './components'

const normalizeVelocity = velocity => velocity / 127.0

const gateOn = (context, destination, buffer, note, stopTime, delta) => {
  playSample({
    context,
    destination,
    buffer,
    pitch: note.pitch,
    stopTime,
    delta
  })
  triggerEnvelope({
    context,
    param: destination.gain,
    sustain: normalizeVelocity(note.velocity),
    delta
  })
}

const getDestination = track => (track ? track.gain : null)

const mapSample = (note, samples) => {
  let lastIndex = samples.length - 1
  let ret = 1
  let playbackVelocity = note.velocity
  if (samples[0].indexOf('snare') > -1) {
    lastIndex--
    if (note.velocity === 127) {
      // special roll sample
      playbackVelocity = 110
      ret = samples.length - 1
    }
  } else {
    if (note.velocity >= 110) {
      ret = 0
    } else if (note.velocity < 35) {
      ret = samples.length - 1
    }
    playbackVelocity = Math.max(note.velocity + ret * 0.2 * 127, 127)
  }
  return [samples[ret], playbackVelocity]
}

export const playNote = (ctx, key, note, noteLen, delta) => {
  const {
    state: {
      mixer: { tracks },
      scene: { parts, tempo, beatLen }
    }
  } = ctx
  const samples = parts[key].samples
  if (!samples) {
    return
  }
  const [sample, playbackVelocity] =
    samples.length === 1
      ? [samples[0], note.velocity]
      : mapSample(note, samples)
  const buffer = ctx.runtime.buffers[sample]
  const destination = getDestination(tracks[key])
  let stopTime
  const context = getContext(ctx)
  if (noteLen) {
    stopTime =
      context.currentTime + (noteLen * 60) / beatLen / tempo + 0.005 + delta
  }
  if (buffer && destination) {
    gateOn(
      context,
      destination,
      buffer,
      { ...note, velocity: playbackVelocity * tracks[key].gainValue },
      stopTime,
      delta
    )
  }
}
