import {VNode, VNodeData} from "snabbdom/vnode";
import {jsx} from '@pkit/snabbdom/jsx'
import {Fragment} from './helper'

export * from './helper'

export type FC<T extends VNodeData = VNodeData> = (data: T, children?: VNode) => VNode

export default {
  jsxFactory: jsx,
  jsxFragmentFactory: Fragment
}

