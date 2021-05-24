import {
  directProc, finishStep,
  ForcePublicPort,
  IKit, mapToProc,
  mergeParamsPrototypeKit,
  ofProc,
  sink,
  source,
} from "@pkit/core";
import {SpaState} from "../../../shared/";
import {SpaClientPort} from "../";

type ISpaClientLogicPort = ForcePublicPort<Omit<SpaClientPort<SpaState>, 'circuit'>>
type Kit = IKit<ISpaClientLogicPort>

const initVdomKit: Kit = (port, {vdom}) =>
  ofProc(sink(port.vdom.init), vdom)

const initStateKit: Kit = (port, {state}) =>
  ofProc(sink(port.state.init), state)

const initFlowKit: Kit = (port) =>
  mapToProc(source(port.state.init), sink(port.state.update), [finishStep('init')])

const initBffKit: Kit = (port, {params:{csr}}) =>
  ofProc(sink(port.bff.init), csr)

const initDomKit: Kit = (port, {dom}) =>
  ofProc(sink(port.dom.init), dom);

const bffUpdateKit: Kit = (port) =>
  directProc(source(port.bff.update.res), sink(port.state.update))

export namespace ISpaClientLogicPort {
  export const prototype = {
    initVdomKit,
    initStateKit,
    initFlowKit,
    initBffKit,
    initDomKit,
    bffUpdateKit
  }
  export const circuit = (port: ISpaClientLogicPort) =>
    mergeParamsPrototypeKit(port, prototype)
}
