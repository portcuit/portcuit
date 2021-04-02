import type {VNode} from 'snabbdom/vnode'
import {
  Socket,
  LifecyclePort,
  EncodedPatch,
  PrivateSocket,
  PrivateSourceSocket,
  PrivateSinkSocket
} from '@pkit/core'
import {ISnabbdomClientPort} from "./logic/";

export class SnabbdomClientPort extends LifecyclePort {
  init = new PrivateSourceSocket<{
    container: Element;
    target: EventTarget;
    options?: {
      window: Window;
      hashchange?: boolean
    }
  }>();
  render = new Socket<VNode>();
  vnode = new PrivateSocket<VNode>();
  action = new Socket<EncodedPatch>();
  event = new class {
    hashchange = new PrivateSinkSocket<string>();
  }

  circuit() { return ISnabbdomClientPort.circuit(this); }
}

Object.assign(SnabbdomClientPort.prototype, ISnabbdomClientPort.prototype);