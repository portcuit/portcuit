import type {Module} from 'snabbdom/modules/module'
import type {VNode} from "snabbdom/vnode";

const createOrUpdate = (oldVnode: VNode, vnode: VNode) => {
  if (!vnode.data) return;
  if (!('detail' in vnode.data)) return;

  // @ts-ignore
  vnode.elm.dataset.detail = JSON.stringify(vnode.data.detail);
};

export const detailModule: Module = {
  create: createOrUpdate,
  update: createOrUpdate
}
