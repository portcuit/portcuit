const {app,BrowserWindow} = require('electron')
const {apply,pipe,always,invoker} = require('ramda')
const {fromEvent} = require('rxjs')
const {compose,plug,source,sink} = require('@pkit/core')
const {latestMap,latestMergeMap,mapCuit,mergeMapCuit} = require('@pkit/helper')

const open = options =>
  new BrowserWindow(options)

const load = (url, window) =>
  window.loadURL(url)

exports.default = (curr, context) =>
  compose(
    plug(latestMergeMap(load, [[0, 0], [1, 0]]),
      source(curr.load), sink(curr.loaded), source(curr.window)),
    plug(latestMap(invoker(0, 'destroy'), [[1, 0]]),
      source(context.terminate), sink(curr.terminated), source(curr.window)),
    plug(mapCuit(open, [[0]]),
      source(curr.open), sink(curr.window)),
    plug(mergeMapCuit(pipe(always([app, 'window-all-closed']), apply(fromEvent))),
      source(context.init), sink(curr.window_all_closed)),
    plug(mapCuit(app.quit, []),
      source(curr.quit), sink(curr.terminated)),
    plug(mergeMapCuit(app.whenReady, []),
      source(context.init), sink(curr.ready)))
