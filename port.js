const {prepare} = require('@pkit/core')

module.exports = prepare({
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
})
