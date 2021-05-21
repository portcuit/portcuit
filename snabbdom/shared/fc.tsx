import Pkit, {FC} from './pkit'

export const Touch: FC<{cond: boolean}> = ({cond}, children) =>
  <>{cond ? children : undefined}</>
