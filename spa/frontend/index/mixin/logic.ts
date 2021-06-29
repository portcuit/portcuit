import {merge} from 'rxjs'
import {filter} from 'rxjs/operators'
import {IFlow, latestMergeMapProc, mapProc, mapToProc, ofProc, sink, source} from "@pkit/core"
import {finishStep} from '@pkit/state'
import {SpaState} from "../../../shared/"
import {bffProc} from '../../lib'
import {SpaFrontendPort} from "../"

type Flow = IFlow<SpaFrontendPort<SpaState>>

export const renderFlow: Flow = (port, {params}) =>
  latestMergeMapProc(source(port.render), sink(port.vdom.render),
    [source(port.view)],
    async ([state, BodyView]) =>
      BodyView({state, params}),
    sink(port.err))

export const initChildPortFlow: Flow = (port, {vdom, state, dom}) =>
  merge(
    ofProc(sink(port.vdom.init), vdom),
    ofProc(sink(port.state.init), state),
    ofProc(sink(port.dom.init), dom)
  )

export const startStateFlow: Flow = (port) =>
  mapToProc(source(port.state.init),
    sink(port.state.update),
    [finishStep('init')])

export const bffFlow: Flow = (port, {params: {csr: {endpoint}}}) =>
  bffProc(source(port.bffState.update), sink(port.state.update), endpoint)

export const renderDecisionFlow: Flow = (port) =>
  mapProc(source(port.state.data).pipe(
    filter(([, batch]) =>
      port.renderDecisionFilter(batch))),
    sink(port.render),
    ([state]) => state)

export const bffDecisionFlow: Flow = (port) =>
  mapProc(source(port.state.data).pipe(
    filter(([, batch]) =>
      port.bffDecisionFilter(batch))),
    sink(port.bffState.update),
    ([{params}, batch]) =>
      [{params}, ...batch])

