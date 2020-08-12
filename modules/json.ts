import type {Module} from 'snabbdom/modules/module'
import type {VNode} from "snabbdom/vnode";

const createOrUpdate = (oldVnode: VNode, vnode: VNode) => {
  if (!('data' in vnode)) return;
  if (vnode.data && !('json' in vnode.data)) return;

  // @ts-ignore
  vnode.data.dataset = Object.assign(vnode.data.dataset || {}, {json: JSON.stringify(vnode.data.json)});
};

const jsonModule: Module = {
  // pre: undefined,
  // destroy: undefined,
  // remove: undefined,
  // post: undefined,
  create: createOrUpdate,
  update: createOrUpdate
} as any;

export default jsonModule;