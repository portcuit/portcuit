const {app,BrowserWindow} = require('electron')
const {apply,pipe,always,invoker,constructN} = require('ramda')
const {fromEvent} = require('rxjs')
const {compose,plug,source,sink} = require('@pkit/core')
const {latestMap,latestMergeMap,mapSink,mergeMapSink} = require('@pkit/helper')
const {load} = require('./processors')

exports.port = {
  ready: null,
  open: null,
  window: null,
  terminated: null,
  will_quit: null,
  prevent_quit: null,
  window_all_closed: null,
  quit: null,
  load: null,
  loaded: null
}

exports.default = (curr, context) =>
  compose(
    plug(latestMergeMap(load, [0, 0], [1, 0]),
      source(curr.load), sink(curr.loaded), source(curr.window)),
    plug(latestMap(invoker(0, 'destroy'), [1, 0]),
      source(context.terminate), sink(curr.terminated), source(curr.window)),
    plug(mapSink(constructN(1, BrowserWindow), [0]),
      source(curr.open), sink(curr.window)),
    plug(mergeMapSink(pipe(always([app, 'window-all-closed']), apply(fromEvent))),
      source(context.init), sink(curr.window_all_closed)),
    plug(mapSink(app.quit),
      source(curr.quit), sink(curr.terminated)),
    plug(mergeMapSink(app.whenReady),
      source(context.init), sink(curr.ready)))
