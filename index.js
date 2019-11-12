const {compose,plug,source,sink} = require('@pkit/core')
const {load, terminate, open, close, quit, ready} = require('./processors')

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
    plug(load,
      source(curr.load), sink(curr.loaded),
      source(curr.window)),
    plug(terminate,
      source(context.terminate), sink(curr.terminated),
      source(curr.window)),
    plug(open,
      source(curr.open), sink(curr.window)),
    plug(close,
      source(context.init), sink(curr.window_all_closed)),
    plug(quit,
      source(curr.quit), sink(curr.terminated)),
    plug(ready,
      source(context.init), sink(curr.ready)))
