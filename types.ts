declare module 'snabbdom/init' {
  export * from 'snabbdom/build/package/init'
}

declare module 'snabbdom/vnode' {
  export * from 'snabbdom/build/package/vnode'
}

declare module 'snabbdom/tovnode' {
  export * from 'snabbdom/build/package/tovnode'
}

declare module 'snabbdom/modules/module' {
  export * from 'snabbdom/build/package/modules/module'
}

declare module 'snabbdom/modules/class' {
  export * from 'snabbdom/build/package/modules/class'
}

declare module 'snabbdom/modules/props' {
  export * from 'snabbdom/build/package/modules/props'
}

declare module 'snabbdom/modules/attributes' {
  export * from 'snabbdom/build/package/modules/attributes'
}

declare module 'snabbdom/modules/style' {
  export * from 'snabbdom/build/package/modules/style'
}

declare module 'snabbdom/modules/eventlisteners' {
  export * from 'snabbdom/build/package/modules/eventlisteners'
}

declare module 'snabbdom/modules/dataset' {
  export * from 'snabbdom/build/package/modules/dataset'
}

declare module 'snabbdom/jsx-global' {
  export * from 'snabbdom/build/package/jsx-global'
}

declare module '@pkit/snabbdom/lib/jsx' {
  export * from 'snabbdom/build/package/jsx'
}

declare module '@pkit/snabbdom/lib/h' {
  export * from 'snabbdom/build/package/h'
}

declare module 'remark-vdom' {
  import {Plugin} from 'unified'
  const vdom: Plugin;
  export default vdom;
}