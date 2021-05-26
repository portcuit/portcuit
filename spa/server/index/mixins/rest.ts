import {
  cycleFlow,
  IFlow, IPort,
  mapToProc,
  ofProc,
  replaceProperty,
  sink,
  source
} from "@pkit/core";
import {SpaState} from "@pkit/spa";
import {SpaServerPort} from "../";

type ISpaServerRestPort = IPort<SpaServerPort<SpaState>>
type Kit = IFlow<ISpaServerRestPort>;

const initRestKit: Kit = (port, {ctx}) =>
  ofProc(sink(port.rest.init), ctx);

const terminateKit: Kit = (port) =>
  mapToProc(source(port.rest.terminated), sink(port.terminated))

export namespace ISpaServerRestPort {
  export const prototype = {
    initRestKit,
    terminateKit
  };
  export const flow = (port: ISpaServerRestPort & typeof prototype) =>
    cycleFlow(port, 'init', 'terminated', replaceProperty(port, prototype))
}
