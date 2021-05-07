import {init} from 'snabbdom'
import {VNode} from 'snabbdom/vnode'
import {Module} from 'snabbdom/modules/module'
import {toVNode} from 'snabbdom/tovnode'
import {Observable} from 'rxjs'
import {map, scan} from 'rxjs/operators'
import {Sink} from 'pkit/core'
import {createLatestMapProc} from 'pkit/processors'

export const terminateSink = (container: HTMLElement) =>
  createLatestMapProc<unknown, Node, [VNode]>(
    ([,vnode]) =>
      vnode.elm.parentNode.replaceChild(container, vnode.elm));

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
