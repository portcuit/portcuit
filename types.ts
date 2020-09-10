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
  import { VNode as _VNode } from 'snabbdom/vnode'
  type VNode = _VNode
  type VNodeData = {
    classNames?: {[key: string]: boolean};
    bind?: {}
    [key: string]: any;
  }
  global {
    /**
     * opt-in jsx intrinsic global interfaces
     * see: https://www.typescriptlang.org/docs/handbook/jsx.html#type-checking
     */
      // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace JSX {
      type Element = VNode
      interface IntrinsicElements {
        [elemName: string]: VNodeData
      }
    }
  }
}

declare module '@pkit/snabbdom/lib/jsx' {
  export * from 'snabbdom/build/package/jsx'
}

declare module '@pkit/snabbdom/lib/h' {
  export * from 'snabbdom/build/package/h'
}

declare module '@pkit/snabbdom/lib/init' {
  export * from 'snabbdom/build/package/init'
}

declare module '@pkit/snabbdom/lib/tovnode' {
  export * from 'snabbdom/build/package/tovnode'
}

declare module '@pkit/snabbdom/lib/modules/attributes' {
  export * from 'snabbdom/build/package/modules/attributes'
}

declare module '@pkit/snabbdom/lib/modules/dataset' {
  export * from 'snabbdom/build/package/modules/dataset'
}

declare module '@pkit/snabbdom/lib/modules/eventlisteners' {
  export * from 'snabbdom/build/package/modules/eventlisteners'
}

declare module '@pkit/snabbdom/lib/modules/props' {
  export * from 'snabbdom/build/package/modules/props'
}
declare module '@pkit/snabbdom/lib/modules/style' {
  export * from 'snabbdom/build/package/modules/style'
}

declare module 'remark-vdom' {
  import {Plugin} from 'unified'
  const vdom: Plugin;
  export default vdom;
}