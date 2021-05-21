import type {VNode} from 'snabbdom'
import {
  Socket,
  LifecyclePort,
  PrivateSocket,
  PrivateSourceSocket,
  PrivateSinkSocket
} from '@pkit/core'
import {ISnabbdomClientPort} from "./logic/";

export class SnabbdomClientPort extends LifecyclePort {
  init = new PrivateSourceSocket<{
    container: Element;
  }>();
  render = new Socket<VNode>();
  vnode = new PrivateSocket<VNode>();
  circuit() { return ISnabbdomClientPort.circuit(this); }
}

Object.assign(SnabbdomClientPort.prototype, ISnabbdomClientPort.prototype);