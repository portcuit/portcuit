export const startStep = <T extends string, U extends any> (p: T, data?: U) =>
  ({step: {[p]: {doing: true, data}}}) as {step: {[P in T]: {doing: true, data: U}}}

export const finishStep = <T extends string> (p: T) =>
  ({step: {[p]: {doing: false, data: null}}}) as {step: {[P in T]: {doing: false, data: null}}}

export const completeStep = <T extends string> (p: T) => [
  {step: {[p]: {finish: true, doing: false, done: true}}},
  {step: {[p]: {finish: false}}}
] as {step: {[P in T]: {finish: boolean}}}[]

const createIsActionStep = (action: string) =>
  <T extends string> (p: T) =>
    <U extends {step?: {[P in T]?: any} | null}> (state: U) => {
      if (!state) {return false}
      if (!state.step) {return false;}
      if (!(p in state.step)) {return false}
      return (state.step[p] as any)[action] === true;
    }

export const isStartStep = createIsActionStep('start')
export const isFinishStep = createIsActionStep('finish')
export const isDoingStep = createIsActionStep('doing')
export const isDoneStep = createIsActionStep('done')