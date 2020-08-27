import type {Module} from 'snabbdom/modules/module'
import type {VNode} from 'snabbdom/vnode'

const createOrUpdate = (oldVNode: VNode, vnode: VNode) => {
  if (!vnode.data) return;

  Object.entries(vnode.data)
    .forEach(([key, value]) => {
      if (['type', 'value', 'placeholder', 'autofocus', 'checked'].includes(key)) {
        (vnode.elm as any)[key] = value;
      }

      if (['for', 'href'].includes(key)) {
        (vnode.elm as any).setAttribute(key, value as any);
      }
    })
}

export const jsxModule: Module = {
  create: createOrUpdate,
  update: createOrUpdate
}

