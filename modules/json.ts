import {Module} from 'snabbdom/modules/module'

const createOrUpdate = (oldVnode, vnode) => {
  if (!('data' in vnode)) return;
  if (!('json' in vnode.data)) return;

  vnode.data.dataset = Object.assign(vnode.data.dataset || {}, {json: JSON.stringify(vnode.data.json)});
};

const jsonModule: Module = {
  pre: undefined,
  destroy: undefined,
  remove: undefined,
  post: undefined,
  create: createOrUpdate,
  update: createOrUpdate
};

export default jsonModule;