import type {VNode, Module} from 'snabbdom'

const createOrUpdate = (oldVNode: VNode, vnode: VNode) => {
  if (!vnode.data) return;

  Object.entries(vnode.data)
    .forEach(([key, value]) => {
      if ([
        'selected', 'checked',
        'type', 'value', 'placeholder', 'autofocus', 'checked', 'id', 'readOnly', 'wrap',
        'download', 'srcObject', 'disabled', 'muted', 'controls', 'currentTime', 'step', 'min', 'max',
        'name'
      ].includes(key)) {
        if ((vnode.elm as any)[key] != value) {
          (vnode.elm as any)[key] = value;
        }
      }

      if ([
        'for', 'href', 'class',
        'viewBox', 'd', 'xmlns', 'fill', 'fill-rule', 'clip-rule', 'points', 'stroke-width', 'stroke',
        'playsinline', 'autoplay', 'src', 'rowspan', 'nowrap'
      ].includes(key)) {
        if ((vnode.elm as any).getAttribute(key) != value) {
          (vnode.elm as any).setAttribute(key, value as any);
        }
      }
    })
}

export const jsxModule: Module = {
  create: createOrUpdate,
  update: createOrUpdate
}

