import {Module} from 'snabbdom-to-html-common'

export const jsxModule: Module = (vnode, attributes) => {
  if (!vnode.data) return;

  for (const [key, value] of Object.entries(vnode.data)) {
    if (['sel', 'classNames', 'bind'].includes(key)) continue;
    attributes.set(key, value);
  }
}