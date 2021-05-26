import {
  cycleFlow,
  directProc,
  IFlow, IPort, mapToProc,
  ofProc, replaceProperty,
  sink,
  source,
} from "@pkit/core";
import {finishStep} from '@pkit/state'
import {SpaState} from "@pkit/spa";
import {SpaClientPort} from "../";

type ISpaClientLogicPort = IPort<SpaClientPort<SpaState>>
type Flow = IFlow<ISpaClientLogicPort>

const initVdomKit: Flow = (port, {vdom}) =>
  ofProc(sink(port.vdom.init), vdom)

const initStateKit: Flow = (port, {state}) =>
  ofProc(sink(port.state.init), state)

const initFlowKit: Flow = (port) =>
  mapToProc(source(port.state.init), sink(port.state.update), [finishStep('init')])

const initBffKit: Flow = (port, {params:{csr}}) =>
  ofProc(sink(port.bff.init), csr)

const initDomKit: Flow = (port, {dom}) =>
  ofProc(sink(port.dom.init), dom);

const bffUpdateKit: Flow = (port) =>
  directProc(source(port.bff.batch), sink(port.state.update))

export namespace ISpaClientLogicPort {
  export const prototype = {
    initVdomKit,
    initStateKit,
    initFlowKit,
    initBffKit,
    initDomKit,
    bffUpdateKit
  }
  export const flow = (port: ISpaClientLogicPort & typeof prototype) =>
    cycleFlow(port, 'init', 'terminated', replaceProperty(port, prototype))
}
