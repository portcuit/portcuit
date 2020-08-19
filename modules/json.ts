import type {Module} from 'snabbdom/modules/module'
import type {VNode} from "snabbdom/vnode";

const createOrUpdate = (oldVnode: VNode, vnode: VNode) => {
  if (!vnode.data) return;
  if (!('json' in vnode.data)) return;

  // @ts-ignore
  vnode.elm.dataset.json = JSON.stringify(vnode.data.json);
};

export const jsonModule: Module = {
  create: createOrUpdate,
  update: createOrUpdate
}
