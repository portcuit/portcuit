import type {Module} from 'snabbdom/modules/module'
import type {VNode} from 'snabbdom/vnode'

export type Dispatcher = {
  [eventName: string]: CustomEventInit
}

const createOrUpdate = (oldVNode: VNode, vnode: VNode) => {
  if (!vnode.data) return;
  if (!vnode.data.dispatch) return;
  if (!vnode.elm) return;

  const dispatcher: Dispatcher = vnode.data.dispatch;

  for ( const [eventName, eventInit] of Object.entries(dispatcher)) {
    if (eventInit.detail) {
      vnode.elm.dispatchEvent(new CustomEvent(eventName, eventInit))
    }
  }

}

export const dispatcherModule: Module = {
  create: createOrUpdate,
  update: createOrUpdate
}