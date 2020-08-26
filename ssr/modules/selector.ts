import {Module} from 'snabbdom-to-html-common'

export const selectorModule: Module = (vnode, attributes) => {
  if (!vnode.data || !vnode.data.sel) return;

  const tokens = (vnode.data.sel as string).split('.');

  let id;
  if ( id = tokens.find((token) => token.startsWith('#')) ) {
    attributes.set('id', id);
  }
  attributes.set('class', tokens.filter((token) => !token.startsWith('#')).join(' '));
}
