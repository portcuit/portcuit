export const startStep = <T extends string> (p: T, data?: any) => [
  {step: {[p]: {start: true, doing: true, data}}},
  {step: {[p]: {start: false, data: null}}}
] as {step: {[P in T]: {start: boolean, data: any}}}[]

export const finishStep = <T extends string> (p: T) => [
  {step: {[p]: {finish: true, doing: false}}},
  {step: {[p]: {finish: false}}}
] as {step: {[P in T]: {finish: boolean}}}[]

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