const {app,BrowserWindow} = require('electron')
const {fromEvent} = require('rxjs')
const {latestMap,latestMergeMap,mapSink,mergeMapSink} = require('@pkit/helper')

const load = (url, window) =>
  window.loadURL(url)

const terminate = window =>
  window.destroy()

const open = options =>
  new BrowserWindow(options)

const close = () =>
  fromEvent(app, 'window-all-closed')

exports.load = latestMergeMap(load, [0, 0], [1, 0])
exports.terminate = latestMap(terminate, [1, 0])
exports.open = mapSink(open, [0])
exports.close = mergeMapSink(close)
exports.quit = mapSink(app.quit)
exports.ready = mergeMapSink(app.whenReady)
