import {Module} from 'snabbdom-to-html-common'

export const jsxModule: Module = (vnode, attributes) => {
  if (!vnode.data) return;

  for (const [key, value] of Object.entries(vnode.data)) {
    if (['sel', 'classNames', 'bind'].includes(key)) {

    } else if (vnode.sel === 'textarea' && key === 'value') {
      vnode.text = value;
    } else if (key === 'innerHTML') {
      vnode.data.props = {
        innerHTML: value
      }
    } else {
      attributes.set(key, value);
    }
  }
}