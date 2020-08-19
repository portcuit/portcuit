import type {Module} from "snabbdom/modules/module";
import type {VNode} from 'snabbdom/vnode'
import {init} from 'snabbdom/init'
import {classModule} from 'snabbdom/modules/class'
import {propsModule} from 'snabbdom/modules/props'
import {attributesModule} from 'snabbdom/modules/attributes'
import {styleModule} from 'snabbdom/modules/style'
import {eventListenersModule} from "snabbdom/modules/eventlisteners"
import {datasetModule} from "snabbdom/modules/dataset";
import {toVNode} from "snabbdom/tovnode";
import {merge} from 'rxjs'
import {map, scan, switchMap} from "rxjs/operators";
import {source, sink, Socket, LifecyclePort} from 'pkit/core'
import {latestMapProc} from "pkit/processors";
import {jsonModule} from './modules/json';
import {selectorModule} from './modules/selector';
import {triggerModule} from './modules/trigger'
import {jsxModule} from './modules/jsx'

export * from './modules/action'
export * from './processors'

export const defaultModules = [
  selectorModule,
  classModule,
  propsModule,
  attributesModule,
  styleModule,
  eventListenersModule,
  datasetModule,
  jsonModule,
  triggerModule,
  jsxModule
];

export type SnabbdomParams = {
  container: Element;
  modules?: Module[];
}

export class SnabbdomPort extends LifecyclePort<SnabbdomParams> {
  render = new Socket<VNode>();
  vnode = new Socket<VNode>();
}

export const snabbdomKit = (port: SnabbdomPort) =>
  merge(
    source(port.init).pipe(
      switchMap(({container, modules = defaultModules}) => {
        const patch = init(modules);
        return source(port.render).pipe(
          scan((acc, vnode) =>
            patch(acc, vnode), toVNode(container)),
          map((value) =>
            sink(port.vnode)(value))
        )
      })),
    latestMapProc(source(port.terminate), sink(port.info), [source(port.init), source(port.vnode)] as const,
      ([,{container}, vnode]) =>
        vnode!.elm!.parentNode!.replaceChild(container, vnode!.elm!)
    )
  );


