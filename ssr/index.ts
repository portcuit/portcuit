import {VNode} from "snabbdom/vnode";
import 'snabbdom-to-html'
import init from 'snabbdom-to-html/init'
import {merge} from "rxjs";
import {latestMapProc, LifecyclePort, sink, Socket, source} from "pkit";
import {jsxModule} from './modules/jsx'
import {classNamesModule} from './modules/classNames'

const toHTML = init([jsxModule, classNamesModule]);

export type SnabbdomSsrParams = {
  fragment: boolean
}

export class SnabbdomSsrPort<T extends SnabbdomSsrParams = SnabbdomSsrParams> extends LifecyclePort<T> {
  render = new Socket<VNode>();
  html = new Socket<string>();
}

export const snabbdomSsrKit = (port: SnabbdomSsrPort) =>
  merge(
    latestMapProc(source(port.render), sink(port.html), [source(port.init)], ([vnode, {fragment} = {fragment: true}]) =>
      (fragment ? '<!DOCTYPE html>' : '') + toHTML(vnode))
  )