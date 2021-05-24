export type StepState = {
  start: boolean;
  finish: boolean;
  doing: boolean;
  done: boolean;
}

export namespace StepState {
  export const initialState = (): StepState =>
    ({
      start: false,
      finish: false,
      doing: false,
      done: false
    })
}

export const startStep = <T extends string>(p: T) =>
  [
    {flow: {[p]: {start: true, doing: true}}},
    {flow: {[p]: {start: false}}}
  ] as {flow: {[P in T]: {start: boolean}}}[]

export const finishStep = <T extends string>(p: T) =>
  [
    {flow: {[p]: {finish: true, doing: false}}},
    {flow: {[p]: {finish: false}}}
  ] as {flow: {[P in T]: {finish: boolean}}}[]

const createIsActionStep = (action: string) =>
  <T extends string>(p: T) =>
    <U extends {flow?: {[P in T]?: any } | null}>([state]: U[]) => {
      if (!state.flow) { return false; }
      if ( !(p in state.flow) ) { return false }
      return (state.flow[p] as any)[action] === true;
    }

export const isStartStep = createIsActionStep('start')
export const isFinishStep = createIsActionStep('finish')
export const isDoingStep = createIsActionStep('doing')