import {SnabbdomServerPort} from "../../../../snabbdom/server";
import {directProc, IKit, LifecyclePort, mergeParamsPrototypeKit, ofProc, sink, Socket, source} from "../../../../core";
import {StatePort} from "../../../../core/state/index";
import {SpaState} from "../../../shared/state";

type ISpaVdomPort = Omit<{vdom: SnabbdomServerPort; html: Socket<string>; state: Omit<StatePort<SpaState>, 'circuit'>} & LifecyclePort, 'circuit'>
type Kit = IKit<ISpaVdomPort>

const initVdomKit: Kit = (port) =>
  ofProc(sink(port.vdom.init))

// const renderKit: Kit = (port, {csr}) =>
//   mapProc(source(port.state.data).pipe(
//     filter(isFinishFlow('render'))),
//     sink(port.vdom.render),
//     ([,state]) => HtmlView({state, params:{csr}}))

const vdomHtmlKit: Kit = (port) =>
  directProc(source(port.vdom.html), sink(port.html))

export namespace ISpaVdomPort {
  export const prototype = {
    initVdomKit,
    vdomHtmlKit
  };
  export const circuit = (port: ISpaVdomPort) =>
    mergeParamsPrototypeKit(port, prototype);
}

