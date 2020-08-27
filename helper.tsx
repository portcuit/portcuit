import type {FC} from './index'
import {jsx} from '@pkit/snabbdom/jsx'

export const Fragment: FC = (props, children) =>
  children!

export const Touch: FC<{cond: boolean}> = ({cond}, children) =>
  <>{cond ? children : undefined}</>

const Dummy = <p>dummy</p>
