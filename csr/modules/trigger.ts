import type {Module} from 'snabbdom/modules/module'
import type {VNode} from 'snabbdom/vnode'

export type Trigger = {
  focus: boolean;
  blur: boolean;
}

const createOrUpdate = (oldVNode: VNode, vnode: VNode) => {
  if (!vnode.data) return;
  if (!vnode.data.trigger) return;
  const trigger: Trigger = vnode.data.trigger;
  const elm = vnode.elm as HTMLInputElement;

  if (trigger.focus !== undefined) {
    elm.focus({preventScroll: trigger.focus})
  }
}

export const triggerModule: Module = {
  create: createOrUpdate,
  update: createOrUpdate
}


