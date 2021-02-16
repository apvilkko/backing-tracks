import { commit } from './state'
import { playNote } from './player'
import { getContext } from './util'
import { KICK, RIDE, SNARE, HC } from '../../tracks'

const WORKER_TICK_LEN = 0.2

export const initialState = {
  playing: false,
  len: 256
}

export const initialRuntime = runtime => ({
  scheduleAheadTime: 0.1,
  currentNote: 0,
  lastTickTime: runtime.instances.context.currentTime
})

const getNextNoteIndex = (track, currentNote) => {
  let index = (currentNote % track.length) + 1
  if (index >= track.length) {
    index = 0
  }
  let rounds = 0
  while (rounds < 2 && !track[index].velocity) {
    index += 1
    if (index >= track.length) {
      index = 0
      rounds += 1
    }
  }
  return index
}

const scheduleNote = (ctx, delta) => {
  const { state, runtime } = ctx
  const currentNote = runtime.sequencer.currentNote
  const scene = state.scene
  Object.keys(scene.parts).forEach(key => {
    const noRelease = [SNARE, KICK, HC, RIDE].includes(key)
    const track = scene.parts[key].pattern
    const index = currentNote % track.length
    const note = track[index]
    const nextNoteIndex = getNextNoteIndex(track, currentNote)
    const thisNoteLen = noRelease
      ? undefined
      : nextNoteIndex > index
      ? nextNoteIndex - index
      : nextNoteIndex + track.length - index
    if (note.velocity) {
      playNote(ctx, key, note, thisNoteLen, delta)
    }
  })
}

const nextNote = ctx => {
  const currentNote = ctx.runtime.sequencer.currentNote
  const seqLength = ctx.state.sequencer.len
  const nextNote = currentNote === seqLength - 1 ? -1 : currentNote
  ctx.runtime.sequencer.currentNote = nextNote + 1
}

const getNextNoteTime = (ctx, time) => {
  const {
    state: {
      scene: { shufflePercentage, tempo, beatLen: beatLen16, isTriple }
    }
  } = ctx
  const beatLen = 60.0 / tempo
  const eighthTime = beatLen / (isTriple ? 3 : 2)
  const currentEighth = Math.floor(time / eighthTime)
  const currentEighthStartTime = currentEighth * eighthTime
  const shuffleAmount = isTriple ? 1.0 : 1.0 + shufflePercentage / 150.0
  const second16thStartTime =
    currentEighthStartTime + (shuffleAmount * beatLen) / beatLen16
  const next8thTime = (currentEighth + 1) * eighthTime
  return time > second16thStartTime ? next8thTime : second16thStartTime
}

const SAFETY_OFFSET = 0.01

export const tick = ctx => {
  const { state, runtime } = ctx
  const rtSeq = runtime.sequencer
  const stSeq = state.sequencer
  const currentTime = getContext(ctx).currentTime
  if (stSeq.playing) {
    let time = rtSeq.lastTickTime
    const nextNotes = []
    let nextNoteTime
    do {
      nextNoteTime = getNextNoteTime(ctx, time)
      if (nextNoteTime < currentTime) {
        nextNotes.push(nextNoteTime)
      }
      time += nextNoteTime - time + 0.005
    } while (nextNoteTime < currentTime)
    // console.log(nextNotes);

    for (let i = 0; i < nextNotes.length; ++i) {
      const delta = Math.max(
        nextNotes[i] - (currentTime - WORKER_TICK_LEN) + SAFETY_OFFSET,
        0
      )
      // console.log(i, currentTime, nextNotes[i], delta);
      scheduleNote(ctx, delta)
      nextNote(ctx)
    }
  }
  ctx.runtime.sequencer.lastTickTime = currentTime
}

export const play = ctx => {
  commit(ctx, 'sequencer.playing', true)
  ctx.runtime.sequencer.nextNoteTime = getContext(ctx).currentTime
}

export const pause = ctx => {
  commit(ctx, 'sequencer.playing', false)
}

export const setSeqLength = (ctx, value) => {
  commit(ctx, 'sequencer.len', value)
}

export const isPlaying = ctx => ctx.state.sequencer.playing
