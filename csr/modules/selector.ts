import type {Module} from 'snabbdom/modules/module'
import type {VNode} from 'snabbdom/vnode'

const createOrUpdate = (oldVNode: VNode, vnode: VNode) => {
  if (!vnode.data) return;
  if (!vnode.data.sel) return;

  const tokens = (vnode.data.sel as string).split('.');

  let id;
  if ( id = tokens.find((token) => token.startsWith('#')) ) {
    (vnode.elm as Element).id = id.substr(1);
  }

  (vnode.elm as Element).className = tokens.filter((token) => !token.startsWith('#')).join(' ');
}

export const selectorModule: Module = {
  create: createOrUpdate,
  update: createOrUpdate
}


