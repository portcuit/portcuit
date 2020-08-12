import type {Module} from "snabbdom/modules/module";
import type {VNode} from 'snabbdom/vnode'
import {init} from 'snabbdom'
import classModule from 'snabbdom/modules/class'
import propsModule from 'snabbdom/modules/props'
import attributesModule from 'snabbdom/modules/attributes'
import styleModule from 'snabbdom/modules/style'
import eventListenersModule from "snabbdom/modules/eventlisteners"
import datasetModule from "snabbdom/modules/dataset";
import toVNode from "snabbdom/tovnode";
import jsonModule from './modules/json';
import {merge} from 'rxjs'
import {source, sink, Socket, LifecyclePort} from 'pkit/core'
import {JSX} from 'snabbdom-jsx'
import {map, scan, switchMap} from "rxjs/operators";
import {latestMapProc} from "pkit/processors";

export const html = JSX('', undefined, ['props', 'class', 'attrs', 'action', 'style', 'dataset', 'json']);
// export {default as createActionModule} from './modules/action'

export const defaultModules = [
  classModule,
  propsModule,
  attributesModule,
  styleModule,
  eventListenersModule,
  jsonModule,
  datasetModule];

export type SnabbdomParams = {
  container: Element;
  modules?: Module[];
}

export class SnabbdomPort extends LifecyclePort<SnabbdomParams> {
  render = new Socket<VNode>();
  vnode = new Socket<VNode>();
  // rendered = new Socket<VNode>();
  // terminated = new Socket<Node>();
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
        // @ts-ignore
        vnode.elm.parentNode.replaceChild(container, vnode.elm)
    )

    // renderSink(container, modules)(
    //   source(port.render), sink(port.rendered)),
    // terminateSink(container)(source(lifecycle.terminate), sink(port.terminated),
    //   [source(port.rendered)])
  );


