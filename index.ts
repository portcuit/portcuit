import {VNode, VNodeData} from "snabbdom/vnode";
import {jsx as _jsx} from '@pkit/snabbdom/jsx'

export * from './helper'

export type FC<T extends VNodeData = VNodeData> = (data: T, children?: VNode) => VNode
export const jsx = _jsx