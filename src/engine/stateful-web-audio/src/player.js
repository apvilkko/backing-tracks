import { getContext } from './util'
import { playSample, triggerEnvelope } from './components'

const normalizeVelocity = (velocity) => velocity / 127.0

const gateOn = (context, destination, buffer, note, stopTime, delta) => {
  playSample({
    context,
    destination,
    buffer,
    pitch: note.pitch,
    stopTime,
    delta,
  })
  triggerEnvelope({
    context,
    param: destination.gain,
    sustain: normalizeVelocity(note.velocity),
    delta,
  })
}

const getDestination = (track) => (track ? track.gain : null)

export const playNote = (ctx, key, note, noteLen, delta) => {
  const {
    state: {
      mixer: { tracks },
      scene: { parts, tempo, beatLen },
    },
  } = ctx
  const buffer = ctx.runtime.buffers[parts[key].sample]
  const destination = getDestination(tracks[key])
  let stopTime
  const context = getContext(ctx)
  if (noteLen) {
    stopTime =
      context.currentTime + (noteLen * 60) / beatLen / tempo + 0.005 + delta
  }
  if (buffer && destination) {
    gateOn(context, destination, buffer, note, stopTime, delta)
  }
}
