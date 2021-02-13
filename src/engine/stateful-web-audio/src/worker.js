import { withDebug } from './debug'

const workerFn = function worker() {
  setInterval(function post() {
    // eslint-disable-line
    self.postMessage(true)
  }, 200)
}

export const startTick = (ctx, fn) => {
  const inlined = `self.addEventListener('message', ${workerFn.toString()});`
  const url = window.URL || window.webkitURL
  const blobUrl = url.createObjectURL(new Blob([inlined]))
  const worker = new Worker(blobUrl)
  worker.postMessage('start')
  worker.addEventListener('message', () => withDebug(fn)(ctx))
  // Store worker reference so it doesn't get nuked automatically
  window.worker = worker
}
