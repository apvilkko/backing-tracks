import { commit } from './state'
import { getContext } from './util'
import { loadSample } from './loader'
import { createInsertEffect, addInsert, setNodeGain } from './mixer'
import * as components from './components'

export const initialState = {
  parts: {},
  master: {},
  shufflePercentage: 0,
  tempo: 120
}

const addInsertEffect = (ctx, key, insert, index, insertSpec = {}) => {
  const context = getContext(ctx)
  const spec = { ...insertSpec, context }
  const insertEffect = createInsertEffect({
    context,
    effect: components[`create${insert.effect}`](spec)
  })
  addInsert(ctx, key, insertEffect, index)
  if (insert.params) {
    Object.keys(insert.params).forEach(param => {
      setNodeGain(insertEffect[param], insert.params[param])
    })
  }
}

const setupInsert = (ctx, key, insert, index) => {
  if (insert.sample) {
    loadSample(ctx, insert.sample).then(() => {
      const buffers = ctx.runtime.buffers
      addInsertEffect(ctx, key, insert, index, {
        buffer: buffers[insert.sample]
      })
    })
  } else {
    addInsertEffect(ctx, key, insert, index)
  }
}

const setupScene = ctx => {
  const {
    state: {
      scene: { parts }
    }
  } = ctx
  Object.keys(parts).forEach(part => {
    ;(parts[part].samples || []).forEach(sample => {
      loadSample(ctx, sample)
    })
    if (parts[part].inserts) {
      parts[part].inserts.forEach((insert, i) =>
        setupInsert(ctx, part, insert, i)
      )
    }
  })
}

export const setScene = (ctx, scene) => {
  commit(ctx, 'scene', scene)
  setupScene(ctx)
}
