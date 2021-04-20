declare module 'snabbdom/jsx-global' {
  import {VNode, VNodeData} from 'snabbdom'

  global {
    namespace JSX {
      type Element = VNode
      interface IntrinsicElements {
        [elemName: string]: Omit<VNodeData, 'class'> & {
          class?: string
        }
      }
    }
  }
}

declare module 'remark-vdom' {
  import {Plugin} from 'unified'
  const vdom: Plugin;
  export default vdom;
}

// declare module 'remark-frontmatter' {
//   import {Plugin} from 'unified'
//   const frontmatter: Plugin;
//   export default frontmatter;
// }