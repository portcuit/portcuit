export const startStep = <T extends string, U extends any> (p: T, data?: U) =>
  ({step: {[p]: {doing: true, data}}}) as {step: {[P in T]: {doing: true, data: U}}}

export const finishStep = <T extends string> (p: T, status?: any) =>
  ({step: {[p]: {doing: false, data: null}}}) as {step: {[P in T]: {doing: false, data: null}}}

export const completeStep = <T extends string> (p: T) => 
  ({step: {[p]: {doing: false, done: true}}}) as {step: {[P in T]: {doing: false, done: true}}}


const createIsDoingStep = (target: boolean) =>
  <T extends string> (p: T) =>
    <U extends {step?: {[P in T]?: any} | null} | null | undefined> (state: U) => {
      if (!state) {return false}
      if (!state.step) {return false;}
      if (!(p in state.step)) {return false}
      return (state.step[p] as any)['doing'] === target;
    }

export const isStartStep = createIsDoingStep(true)
export const isFinishStep = createIsDoingStep(false)

const createIsActionStep = (action: string) =>
  <T extends string> (p: T) =>
    <U extends {step?: {[P in T]?: any} | null}> (state: U) => {
      if (!state) {return false}
      if (!state.step) {return false;}
      if (!(p in state.step)) {return false}
      return (state.step[p] as any)[action] === true;
    }

// export const isStartStep = createIsActionStep('start')
// export const isFinishStep = createIsActionStep('finish')
export const isDoingStep = createIsActionStep('doing')
export const isDoneStep = createIsActionStep('done')

export const isNotDoneStep = <T extends string> (p: T) =>
    <U extends {step?: {[P in T]?: any} | null}> (state: U) => {
      if (!state) {return false}
      if (!state.step) {return false;}
      if (!(p in state.step)) {return false}
      return (state.step[p] as any)['done'] !== true
    }

const createIsNotDoingStep = () =>
  <T extends string> (p: T) =>
    <U extends {step?: {[P in T]?: any} | null}> (state: U) => {
      if (!state) {return false}
      if (!state.step) {return false;}
      if (!(p in state.step)) {return false}
      return (state.step[p] as any)['doing'] !== true
    }

export const isNotDoingStep = createIsNotDoingStep()