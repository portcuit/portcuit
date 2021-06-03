import {init, toVNode} from 'snabbdom'
import {scan} from "rxjs/operators";
import {
  source,
  sink,
  directProc,
  IFlow, IPort, cycleFlow, latestMapProc
} from '@pkit/core'
import {defaultModules} from '../modules/'
import {SnabbdomClientPort} from "../";

export type ISnabbdomClientLogicPort = IPort<SnabbdomClientPort>
type Flow = IFlow<ISnabbdomClientLogicPort>

const patchFlow: Flow = (port, {container}) => {
  const patch = init(defaultModules);
  return directProc(source(port.render).pipe(
    scan((acc, vnode) =>
      patch(acc, vnode), toVNode(container))),
    sink(port.vnode));
}

// it can subscribe with at least onetime invoking render sink
const terminateFlow: Flow = (port: ISnabbdomClientLogicPort, {container}) =>
  latestMapProc(source(port.terminate), sink(port.terminated),
    [source(port.vnode)], ([,vnode]) =>
      vnode!.elm!.parentNode!.replaceChild(container, vnode!.elm!));

export namespace ISnabbdomClientLogicPort {
  export const prototype = {
    patchFlow,
    terminateFlow
  };
  export const flow = (port: ISnabbdomClientLogicPort) =>
    cycleFlow(port, 'init', 'terminated', prototype)
}
