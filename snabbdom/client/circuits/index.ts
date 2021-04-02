import {init} from 'snabbdom/init'
import {toVNode} from "snabbdom/tovnode";
import {propsModule} from 'snabbdom/modules/props'
import {attributesModule} from 'snabbdom/modules/attributes'
import {styleModule} from 'snabbdom/modules/style'
import {eventListenersModule} from "snabbdom/modules/eventlisteners"
import {datasetModule} from "snabbdom/modules/dataset";
import {fromEvent, merge} from 'rxjs'
import {map, scan, switchMap, filter} from "rxjs/operators";
import {
  source,
  sink,
  directProc,
  latestMapProc,
  mergeMapProc,
  mergePrototypeKit,
  ForcePublicPort
} from '@pkit/core'
import {classNamesModule} from '../modules/classNames'
import {selectorModule} from '../modules/selector';
import {triggerModule} from '../modules/trigger'
import {dispatcherModule} from '../modules/dispatcher'
import {jsxModule} from '../modules/jsx'
import {createActionModule} from "../modules/action";
import {ActionDetail} from '../modules/action'
import {SnabbdomClientPort} from "../index";

export const defaultModules = [
  selectorModule,
  propsModule,
  attributesModule,
  styleModule,
  eventListenersModule,
  datasetModule,
  triggerModule,
  dispatcherModule,
  jsxModule,
  classNamesModule
];

export type ISnabbdomClientPort = ForcePublicPort<SnabbdomClientPort>

const patchKit = (port: ISnabbdomClientPort) =>
  source(port.init).pipe(
    switchMap(({container, target}) => {
      const patch = init([createActionModule(target), ...defaultModules]);
      return directProc(source(port.render).pipe(
        scan((acc, vnode) =>
          patch(acc, vnode), toVNode(container))),
        sink(port.vnode));
    }));

const actionKit = (port: ISnabbdomClientPort) =>
  mergeMapProc(source(port.init), sink(port.action), ({target}) =>
    fromEvent<CustomEvent<ActionDetail>>(target as any, 'action').pipe(
      map(({detail}) =>
        detail)));

const terminateKit = (port: ISnabbdomClientPort) =>
  latestMapProc(source(port.terminate), sink(port.info), [source(port.init), source(port.vnode)] as const,
    ([,{container}, vnode]) =>
      vnode!.elm!.parentNode!.replaceChild(container, vnode!.elm!));

const optionsKit = (port: ISnabbdomClientPort) =>
  source(port.init).pipe(
    filter(({options}) =>
      !!options),
    map(({options}) =>
      options!),
    switchMap(({window, hashchange}) =>
      merge(...(hashchange ? [
        directProc(fromEvent<void>(window, 'hashchange').pipe(
          map(() =>
            window.location.hash)), sink(port.event.hashchange))
      ]: []))));

export namespace ISnabbdomClientPort {
  export const prototype = {patchKit, actionKit, terminateKit, optionsKit};
  export const circuit = (port: ISnabbdomClientPort) => mergePrototypeKit(port, prototype);
}
