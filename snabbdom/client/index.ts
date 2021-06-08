import {init, toVNode, VNode} from 'snabbdom'
import {scan} from 'rxjs/operators'
import {Socket, Port, PortParams, directProc, source, sink, latestMapProc} from '@pkit/core'
import {defaultModules} from './modules/'

export class SnabbdomClientPort extends Port {
  init = new Socket<{
    container: Element;
  }>();
  render = new Socket<VNode>();
  vnode = new Socket<VNode>();

  patchFlow = (port: this, {container}: PortParams<this>, patch = init(defaultModules)) =>
    directProc(source(port.render).pipe(
      scan((acc, vnode) =>
        patch(acc, vnode), toVNode(container))),
      sink(port.vnode))

  // it can subscribe with at least onetime invoking render sink
  terminateFlow = (port: this, {container}: PortParams<this>) =>
    latestMapProc(source(port.terminate), sink(port.complete),
      [source(port.vnode)], ([, vnode]) =>
      vnode!.elm!.parentNode!.replaceChild(container, vnode!.elm!))

}
