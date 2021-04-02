import {VNode} from "snabbdom/vnode";
import 'snabbdom-to-html'
import init from 'snabbdom-to-html/init'
import {
  DeepPartialPort,
  ForcePublicPort,
  latestMapProc,
  LifecyclePort, mergePrototypeKit,
  sink,
  source,
  PrivateSourceSocket,
  PrivateSinkSocket
} from "@pkit/core";
import {jsxModule} from './modules/jsx'
import {classNamesModule} from './modules/classNames'

const toHTML = init([jsxModule, classNamesModule]);

export class SnabbdomServerPort extends LifecyclePort {
  init = new PrivateSourceSocket<{
    fragment: boolean
  }>();
  render = new PrivateSourceSocket<VNode>();
  html = new PrivateSinkSocket<string>();

  constructor(port: DeepPartialPort<SnabbdomServerPort> = {}) { super(); }

  circuit () { return ISnabbdomServerPort.circuit(this) }
}

export type ISnabbdomServerPort = ForcePublicPort<SnabbdomServerPort>;

const renderKit = (port: ISnabbdomServerPort) =>
  latestMapProc(source(port.render), sink(port.html), [source(port.init)], ([vnode, {fragment} = {fragment: true}]) =>
    (fragment ? '<!DOCTYPE html>' : '') + toHTML(vnode))

export namespace ISnabbdomServerPort {
  export const prototype = {renderKit}
  export const circuit = (port: ISnabbdomServerPort) =>
    mergePrototypeKit(port, prototype)
}

Object.assign(SnabbdomServerPort.prototype, ISnabbdomServerPort.prototype);