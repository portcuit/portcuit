export type StateFlow = {
  start: boolean;
  finish: boolean;
  doing: boolean;
  done: boolean;
}

export namespace StateFlow {
  export const initialValue = (): StateFlow =>
    ({
      start: false,
      finish: false,
      doing: false,
      done: false
    })
}

export const startFlow = <T extends string>(p: T) =>
  [
    {flow: {[p]: {start: true, doing: true}}},
    {flow: {[p]: {start: false}}}
  ] as {flow: {[P in T]: {start: boolean}}}[]

export const finishFlow = <T extends string>(p: T) =>
  [
    {flow: {[p]: {finish: true, doing: false}}},
    {flow: {[p]: {finish: false}}}
  ] as {flow: {[P in T]: {finish: boolean}}}[]

const createIsActionFlow = (action: string) =>
  <T extends string>(p: T) =>
    <U extends {flow?: {[P in T]?: any } | null}>([state]: U[]) => {
      if (!state.flow) { return false; }
      if ( !(p in state.flow) ) { return false }
      return (state.flow[p] as any)[action] === true;
    }

export const isStartFlow = createIsActionFlow('start')
export const isFinishFlow = createIsActionFlow('finish')
export const isDoingFlow = createIsActionFlow('doing')