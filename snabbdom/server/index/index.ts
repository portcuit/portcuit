import {VNode} from "snabbdom";
import {
  Port,
  PrivateSourceSocket,
  PrivateSinkSocket
} from "@pkit/core";
import {ISnabbdomServerLogicPort} from "./mixins/logic";

export class SnabbdomServerPort extends Port {
  init = new PrivateSourceSocket<{
    fragment: boolean
  }>();
  render = new PrivateSourceSocket<VNode>();
  html = new PrivateSinkSocket<string>();

  circuit () {
    return ISnabbdomServerLogicPort.flow({...ISnabbdomServerLogicPort.prototype, ...this})
  }
}
