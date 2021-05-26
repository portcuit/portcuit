import {
  cycleFlow,
  directProc,
  IFlow, IPort,
  ofProc, replaceProperty,
  sink,
  Socket,
  source
} from "@pkit/core";
import {SnabbdomServerPort} from "@pkit/snabbdom/server";
import {SpaState} from "@pkit/spa";
import {SpaServerPort} from "../index";

export type ISpaServerVdomPort = {vdom: SnabbdomServerPort; html: Socket<string>;} & IPort<SpaServerPort<SpaState>>
type Flow = IFlow<ISpaServerVdomPort>

const initVdomFlow: Flow = (port) =>
  ofProc(sink(port.vdom.init))

const vdomHtmlFlow: Flow = (port) =>
  directProc(source(port.vdom.html), sink(port.html))

export namespace ISpaServerVdomPort {
  export const prototype = {
    initVdomFlow,
    vdomHtmlFlow
  };
  export const flow = (port: ISpaServerVdomPort & typeof prototype) =>
    cycleFlow(port, 'init', 'terminated', replaceProperty(port, prototype))
}

