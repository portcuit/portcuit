import 'snabbdom-to-html'
import init from 'snabbdom-to-html/init'
import {VNode} from "snabbdom";
import {Port, PortParams, Socket, mapProc, source, sink, ofProc} from "@pkit/core";
import {jsxModule, classNamesModule} from './modules/'

export class SnabbdomServerPort extends Port {
  init = new Socket<{
    fragment: boolean
  }>();
  render = new Socket<VNode>();
  html = new Socket<string>();

  renderFlow = (port: this, params: PortParams<this>, fragment = params?.fragment || true) => {
    const toHTML = init([jsxModule, classNamesModule]);
    return mapProc(source(port.render), sink(port.html),
      (vnode) => (fragment ? '<!DOCTYPE html>' : '') + toHTML(vnode))
  }

  readyFlow = (port: this) =>
    ofProc(sink(port.ready))
}
