import {VNode, VNodeData, jsx} from "snabbdom";

export type FC<T extends VNodeData = VNodeData> =
  {fc(data: T, children?: VNode): VNode}['fc']

export const Fragment: FC = (props, children) =>
  children!

export type IProps<T, U> = {state: T, _state?: T, params: U, _params?: U, props?: IProps<T, U>}

export default {
  jsxFactory: jsx,
  jsxFragmentFactory: Fragment
}