import {getContext} from './util';
import {playSample, triggerEnvelope} from './components';

const normalizeVelocity = velocity => velocity / 127.0;

const gateOn = (context, destination, buffer, note, stopTime) => {
  playSample({
    context,
    destination,
    buffer,
    pitch: note.pitch,
    stopTime,
  });
  triggerEnvelope({
    context,
    param: destination.gain,
    sustain: normalizeVelocity(note.velocity),
  });
};


const getDestination = track => (track ? track.gain : null);

export const playNote = (ctx, key, note, noteLen) => {
  const {state: {mixer: {tracks}, scene: {parts, tempo}}} = ctx;
  const buffer = ctx.runtime.buffers[parts[key].sample];
  const destination = getDestination(tracks[key]);
  let stopTime;
  const context = getContext(ctx);
  if (noteLen) {
    stopTime = context.currentTime + (noteLen * 0.25 * 60 / tempo) + 0.005;
  }
  if (buffer && destination) {
    gateOn(context, destination, buffer, note, stopTime);
  }
};
