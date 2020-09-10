import type {VNode, VNodeData} from 'snabbdom/vnode'
import {init} from '@pkit/snabbdom/lib/init'
import {toVNode} from "@pkit/snabbdom/lib/tovnode";
import {propsModule} from '@pkit/snabbdom/lib/modules/props'
import {attributesModule} from '@pkit/snabbdom/lib/modules/attributes'
import {styleModule} from '@pkit/snabbdom/lib/modules/style'
import {eventListenersModule} from "@pkit/snabbdom/lib/modules/eventlisteners"
import {datasetModule} from "@pkit/snabbdom/lib/modules/dataset";
import {fromEvent, merge} from 'rxjs'
import {map, scan, switchMap, filter} from "rxjs/operators";
import {source, sink, Socket, LifecyclePort, StatePort, directProc, latestMapProc, mergeMapProc} from 'pkit'
import {classNamesModule} from './modules/classNames'
import {selectorModule} from './modules/selector';
import {triggerModule} from './modules/trigger'
import {jsxModule} from './modules/jsx'
import {createActionModule} from "./modules/action";
import {actionProc} from "./processors";
import {ActionDetail} from './modules/action'

export * from './modules/action'
export * from './processors'

export const defaultModules = [
  selectorModule,
  propsModule,
  attributesModule,
  styleModule,
  eventListenersModule,
  datasetModule,
  triggerModule,
  jsxModule,
  classNamesModule
];

export type SnabbdomParams = {
  container: Element;
  target: EventTarget;
  options?: {
    window: Window;
    hashchange?: boolean
  }
}

export class SnabbdomPort extends LifecyclePort<SnabbdomParams> {
  render = new Socket<VNode>();
  vnode = new Socket<VNode>();
  action = new Socket<ActionDetail>();
  event = new class {
    hashchange = new Socket<string>();
  }
}

export const snabbdomKit = (port: SnabbdomPort) =>
  merge(
    source(port.init).pipe(
      switchMap(({container, target}) => {
        const patch = init([createActionModule(target), ...defaultModules]);
        return directProc(source(port.render).pipe(
          scan((acc, vnode) =>
            patch(acc, vnode), toVNode(container))),
          sink(port.vnode));
      })),
    latestMapProc(source(port.terminate), sink(port.info), [source(port.init), source(port.vnode)] as const,
      ([,{container}, vnode]) =>
        vnode!.elm!.parentNode!.replaceChild(container, vnode!.elm!)),
    mergeMapProc(source(port.init), sink(port.action), ({target}) =>
      fromEvent<CustomEvent<ActionDetail>>(target as any, 'action').pipe(
        map(({detail}) =>
          detail))),
    optionsKit(port)
  );

export const snabbdomActionPatchKit = <T>(port: SnabbdomPort, state: StatePort<T>) =>
  actionProc(source(port.action), sink(state.patch))

const optionsKit = (port: SnabbdomPort) =>
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
      ]: [])))
  );
