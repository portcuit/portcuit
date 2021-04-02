import {VNode} from "snabbdom/vnode";
import {
  LifecyclePort,
  PrivateSourceSocket,
  PrivateSinkSocket
} from "@pkit/core";
import {ISnabbdomServerPort} from "./logic/";

export class SnabbdomServerPort extends LifecyclePort {
  init = new PrivateSourceSocket<{
    fragment: boolean
  }>();
  render = new PrivateSourceSocket<VNode>();
  html = new PrivateSinkSocket<string>();

  circuit () {
    return ISnabbdomServerPort.circuit(this)
  }
}

Object.assign(SnabbdomServerPort.prototype, ISnabbdomServerPort.prototype);