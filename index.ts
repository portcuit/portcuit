import {VNode, VNodeData as VNodeDataOrigin} from 'snabbdom/vnode'
import classModule from 'snabbdom/modules/class'
import propsModule from 'snabbdom/modules/props'
import attributesModule from 'snabbdom/modules/attributes'
import styleModule from 'snabbdom/modules/style'
import eventListenersModule from "snabbdom/modules/eventlisteners"
import {merge} from 'rxjs'
import {source, sink, Socket, LifecyclePort} from 'pkit/core'
import {renderSink, terminateSink} from './processors'
import {ActionVNodeData} from './action';

export const defaultModules = [
  classModule,
  propsModule,
  attributesModule,
  styleModule,
  eventListenersModule];

export class SnabbdomPort extends LifecyclePort {
  render = new Socket<VNode>();
  rendered = new Socket<VNode>();
  terminated = new Socket<Node>();
}

export const useSnabbdom = (port: SnabbdomPort, lifecycle: LifecyclePort, container, modules=defaultModules) =>
  merge(
    renderSink(container, modules)(
      source(port.render), sink(port.rendered)),
    terminateSink(container)(source(lifecycle.terminate), sink(port.terminated),
      [source(port.rendered)]));

export interface VNodeData extends VNodeDataOrigin, ActionVNodeData {}

export {default as action, ActionData} from './action'
export {default as h} from './h'
