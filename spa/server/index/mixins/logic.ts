import {
  cycleFlow,
  IFlow,
  IPort,
  ofProc,
  replaceProperty,
  sink
} from "@pkit/core";
import {SpaState} from "@pkit/spa";
import {SpaServerPort} from "../";

type ISpaServerLogicPort = IPort<SpaServerPort<SpaState>>
type Kit = IFlow<ISpaServerLogicPort>

const initStateKit: Kit = (port, {state}) =>
  ofProc(sink(port.state.init), state);

export namespace ISpaServerLogicPort {
  export const prototype = {
    initStateKit
  }
  export const flow = (port: ISpaServerLogicPort & typeof prototype) =>
    cycleFlow(port, 'init', 'terminated', replaceProperty(port, prototype))
}
