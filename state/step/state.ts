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
    {step: {[p]: {start: true, doing: true}}},
    {step: {[p]: {start: false}}}
  ] as {step: {[P in T]: {start: boolean}}}[]

export const finishStep = <T extends string>(p: T) =>
  [
    {step: {[p]: {finish: true, doing: false}}},
    {step: {[p]: {finish: false}}}
  ] as {step: {[P in T]: {finish: boolean}}}[]

const createIsActionStep = (action: string) =>
  <T extends string>(p: T) =>
    <U extends {step?: {[P in T]?: any } | null}>([state]: U[]) => {
      if (!state.step) { return false; }
      if ( !(p in state.step) ) { return false }
      return (state.step[p] as any)[action] === true;
    }

export const isStartStep = createIsActionStep('start')
export const isFinishStep = createIsActionStep('finish')
export const isDoingStep = createIsActionStep('doing')