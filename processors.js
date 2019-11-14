const {app,BrowserWindow} = require('electron')
const {fromEvent} = require('rxjs')
const {latestMapSink,latestMergeMapSink,mapSink,mergeMapSink} = require('@pkit/helper')

const load = (window, url, options={}) =>
  window.loadURL(url, options)

const terminate = window =>
  window.destroy()

const open = options =>
  new BrowserWindow(options)

const close = () =>
  fromEvent(app, 'window-all-closed')

exports.load = latestMergeMapSink(load, [1, 0], [0, 0])
exports.terminate = latestMapSink(terminate, [1, 0])
exports.open = mapSink(open, [0])
exports.close = mergeMapSink(close)
exports.quit = mapSink(app.quit)
exports.ready = mergeMapSink(app.whenReady)
