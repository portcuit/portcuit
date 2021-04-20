import {init, toVNode} from 'snabbdom'
import {fromEvent} from 'rxjs'
import {map, scan} from "rxjs/operators";
import {
  source,
  sink,
  directProc,
  ForcePublicPort, IKit, mapProc, ofProc, mergeParamsPrototypeKit
} from '@pkit/core'
import {defaultModules, createActionModule, ActionDetail} from '../../modules/'
import {SnabbdomClientPort} from "../";

export type ISnabbdomClientPort = ForcePublicPort<SnabbdomClientPort>

const patchKit: IKit<ISnabbdomClientPort> = (port, {container, target}) => {
  const patch = init([createActionModule(target), ...defaultModules]);
  return directProc(source(port.render).pipe(
    scan((acc, vnode) =>
      patch(acc, vnode), toVNode(container))),
    sink(port.vnode));
}

const actionKit: IKit<ISnabbdomClientPort> = (port: ISnabbdomClientPort, {target}) =>
  directProc(fromEvent<CustomEvent<ActionDetail>>(target as any, 'action').pipe(
    map(({detail}) => detail)),
    sink(port.action))

const terminateKit: IKit<ISnabbdomClientPort> = (port: ISnabbdomClientPort, {container}) =>
  mapProc(source(port.terminate), sink(port.terminated),
    (vnode) => vnode!.elm!.parentNode!.replaceChild(container, vnode!.elm!));

const hashchangeKit: IKit<ISnabbdomClientPort> = (port: ISnabbdomClientPort, {options}) =>
  !!options?.hashchange ?
    directProc(fromEvent<void>(window, 'hashchange').pipe(
      map(() =>
        window.location.hash)), sink(port.event.hashchange)) :
    ofProc(sink(port.debug), 'no hashchange')

export namespace ISnabbdomClientPort {
  export const prototype = {patchKit, actionKit, terminateKit, hashchangeKit};
  export const circuit = (port: ISnabbdomClientPort) =>
    mergeParamsPrototypeKit(port, prototype);
}
