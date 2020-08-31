import {VNode, VNodeData} from "snabbdom/vnode";
import {jsx} from '@pkit/snabbdom/lib/jsx'

export type FC<T extends VNodeData = VNodeData> = (data: T, children?: VNode) => VNode

export const Fragment: FC = (props, children) =>
  children!

export default {
  jsxFactory: jsx,
  jsxFragmentFactory: Fragment
}