import {init} from 'snabbdom'
import {VNode} from 'snabbdom/vnode'
import {Module} from 'snabbdom/modules/module'
import {toVNode} from 'snabbdom/tovnode'
import {Observable} from 'rxjs'
import {map, scan} from 'rxjs/operators'
import {Sink} from 'pkit/core'
// import {BindProcessor, WithBindProcessor1, withLatestMapSink} from 'pkit1/processors'
import {createLatestMapSink} from 'pkit/processors'

export const terminateSink = (container: HTMLElement) =>
  createLatestMapSink<unknown, Node, VNode>(
    ([,vnode]) =>
      vnode.elm.parentNode.replaceChild(container, vnode.elm));

// export const terminate: WithBindProcessor1<[PortData,[VNode]],[Node],[HTMLElement]> = (source$, sink, sources$, [container]) =>
//   withLatestMapSink(source$, sink, sources$,
//     ([,[vnode]]) =>
//       vnode.elm.parentNode.replaceChild(container, vnode.elm));

export const renderSink = (container: HTMLElement, modules: Module[]) => {
  const patch = init(modules);
  return (source$: Observable<VNode>, sink: Sink<VNode>) =>
    source$.pipe(
      scan(
        (acc, vnode) =>
          patch(acc || toVNode(container), vnode), null),
      map(value =>
        sink(value)));
};

// export const render: BindProcessor<[VNode], [VNode], [HTMLElement, Module[]]> = (source$, sink, [container, modules]) => {
//   const patch = init(modules);
//   return source$.pipe(
//     scan(
//       (acc, [vnode]) =>
//         patch(acc || toVNode(container), vnode), null),
//     map(value =>
//       sink(value)))
// };
