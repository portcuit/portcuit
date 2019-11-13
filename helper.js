const {compose,plug,source,sink} = require('@pkit/core')
const {direct,mapToSink} = require('@pkit/helper')

exports.useElectron = (electron, context, path, options) =>
  compose(
    plug(mapToSink(path),
      source(electron.window), sink(electron.load)),
    plug(direct, source(electron.terminated), sink(context.terminated)),
    plug(mapToSink(options), source(electron.ready), sink(electron.open)))