import {VNode, VNodeData} from "snabbdom/vnode";
import {jsx} from 'snabbdom/jsx'

export type FC<T extends VNodeData = VNodeData> =
  {fc(data: T, children?: VNode): VNode}['fc']

export const Fragment: FC = (props, children) =>
  children!

export default {
  jsxFactory: jsx,
  jsxFragmentFactory: Fragment
}