import {init, toVNode} from 'snabbdom'
import {scan} from "rxjs/operators";
import {
  source,
  sink,
  directProc,
  ForcePublicPort, IFlow, mapProc, mergeParamsPrototypeKit
} from '@pkit/core'
import {defaultModules} from '../modules/'
import {SnabbdomClientPort} from "../";

export type ISnabbdomClientPort = ForcePublicPort<SnabbdomClientPort>

const patchKit: IFlow<ISnabbdomClientPort> = (port, {container}) => {
  const patch = init(defaultModules);
  return directProc(source(port.render).pipe(
    scan((acc, vnode) =>
      patch(acc, vnode), toVNode(container))),
    sink(port.vnode));
}

const terminateKit: IFlow<ISnabbdomClientPort> = (port: ISnabbdomClientPort, {container}) =>
  mapProc(source(port.terminate), sink(port.terminated),
    (vnode) => vnode!.elm!.parentNode!.replaceChild(container, vnode!.elm!));

export namespace ISnabbdomClientPort {
  export const prototype = {
    patchKit,
    terminateKit
  };
  export const circuit = (port: ISnabbdomClientPort) =>
    mergeParamsPrototypeKit(port, prototype);
}
