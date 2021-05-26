import type {VNode} from 'snabbdom'
import {
  Socket,
  LifecyclePort,
  PrivateSocket,
  PrivateSourceSocket,
  PrivateSinkSocket
} from '@pkit/core'
import {ISnabbdomClientLogicPort} from "./mixins/logic";

export class SnabbdomClientPort extends LifecyclePort {
  init = new PrivateSourceSocket<{
    container: Element;
  }>();
  render = new Socket<VNode>();
  vnode = new PrivateSocket<VNode>();
  circuit() {
    return ISnabbdomClientLogicPort.circuit({...ISnabbdomClientLogicPort.prototype, ...this});
  }
}
