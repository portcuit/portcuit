import {directProc, IFlow, LifecyclePort, mergeParamsPrototypeKit, ofProc, sink, Socket, source} from "@pkit/core";
import {StatePort} from '@pkit/state'
import {SnabbdomServerPort} from "@pkit/snabbdom/server";
import {SpaState} from "../../../shared/";

type ISpaVdomPort = Omit<{vdom: SnabbdomServerPort; html: Socket<string>; state: Omit<StatePort<SpaState>, 'circuit'>} & LifecyclePort, 'circuit'>
type Kit = IFlow<ISpaVdomPort>

const initVdomKit: Kit = (port) =>
  ofProc(sink(port.vdom.init))

const vdomHtmlKit: Kit = (port) =>
  directProc(source(port.vdom.html), sink(port.html))

export namespace ISpaServerVdomPort {
  export const prototype = {
    initVdomKit,
    vdomHtmlKit
  };
  export const circuit = (port: ISpaVdomPort) =>
    mergeParamsPrototypeKit(port, prototype);
}

