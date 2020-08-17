import type {Module} from 'snabbdom/modules/module'
import type {VNode} from "snabbdom/vnode";

const createOrUpdate = (oldVnode: VNode, vnode: VNode) => {
  if (!vnode.data) return;
  if (!vnode.data.json) return;

  vnode.data.dataset = Object.assign(vnode.data.dataset || {}, {json: JSON.stringify(vnode.data.json)});
};

export const jsonModule: Module = {
  create: createOrUpdate,
  update: createOrUpdate
}
