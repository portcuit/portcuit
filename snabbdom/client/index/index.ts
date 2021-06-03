import type {VNode} from 'snabbdom'
import {Socket, Port} from '@pkit/core'
import {ISnabbdomClientLogicPort} from "./mixins/logic";

export class SnabbdomClientPort extends Port {
  init = new Socket<{
    container: Element;
  }>();
  render = new Socket<VNode>();
  vnode = new Socket<VNode>();

  flow() {
    return ISnabbdomClientLogicPort.flow(this)
  }
}
