import {
  directProc,
  ForcePublicPort,
  IKit, mapToProc,
  mergeParamsPrototypeKit,
  ofProc,
  sink,
  source, startFlow,
} from "@pkit/core";
import {SpaState} from "../../../shared/";
import {SpaClientPort} from "../";

type SpaClientLogicPort = ForcePublicPort<SpaClientPort<SpaState>>
type Kit = IKit<SpaClientLogicPort>

const initVdomKit: Kit = (port, {vdom}) =>
  ofProc(sink(port.vdom.init), vdom)

const initStateKit: Kit = (port, {state}) =>
  ofProc(sink(port.state.init), state)

const initFlowKit: Kit = (port) =>
  mapToProc(source(port.state.init), sink(port.state.update), [startFlow('init')])

const initBffKit: Kit = (port, {params:{csr}}) =>
  ofProc(sink(port.bff.init), csr)

const initDomKit: Kit = (port, {dom}) =>
  ofProc(sink(port.dom.init), dom);

const bffUpdateKit: Kit = (port) =>
  directProc(source(port.bff.update.res), sink(port.state.update))

export namespace SpaClientLogicPort {
  export const prototype = {
    initVdomKit,
    initStateKit,
    initFlowKit,
    initBffKit,
    initDomKit,
    bffUpdateKit
  }
  export const circuit = (port: SpaClientLogicPort) =>
    mergeParamsPrototypeKit(port, prototype)
}
