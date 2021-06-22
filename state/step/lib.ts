import {pipe, not} from 'ramda'

export const startStep = <T extends string, U extends any> (p: T, data?: U) =>
  ({step: {[p]: {start: true, finish: false, doing: true, data, status: null}}}) as
  {step: {[P in T]: {start: true, finish: false, doing: true, data: U, status: null}}}

export const finishStep = <T extends string, U extends any> (p: T, status?: U) =>
  ({step: {[p]: {start: false, finish: true, doing: false, data: null, status}}}) as
  {step: {[P in T]: {start: false, finish: true, doing: false, data: null, status: U}}}

export const completeStep = <T extends string, U extends any> (p: T, status?: U) =>
  ({step: {[p]: {start: false, finish: true, doing: false, data: null, status, done: true}}}) as
  {step: {[P in T]: {start: false, finish: true, doing: false, data: null, status: U, done: true}}}

export const createIsBatchStep = (action: 'start' | 'finish') =>
  <T extends string> (p: T) =>
    <U extends {step?: {[P in T]?: any} | null} | null | undefined> (state: U) => {
      if (!state) {return false}
      if (!state.step) {return false}
      if (!state.step[p]) {return false}
      if (!(action in state.step[p])) {return false}
      return state.step[p][action] === true
    }

export const isStartStep = createIsBatchStep('start')
export const isFinishStep = createIsBatchStep('finish')

const createIsStateStep = (action: 'doing' | 'done') =>
  <T extends string> (p: T) =>
    <U extends {step?: {[P in T]?: any} | null}> (state: U) => {
      if (!state) {return false}
      if (!state.step) {return false;}
      if (!(p in state.step)) {return false}
      return (state.step[p] as any)[action] === true;
    }

export const isDoingStep = createIsStateStep('doing')
export const isDoneStep = createIsStateStep('done')

export const isNotDoingStep = <T extends string> (p: T) =>
  <U extends {step?: {[P in T]?: any} | null}> (state: U) =>
    !isDoingStep(p)(state)

export const isNotDoneStep = <T extends string> (p: T) =>
  <U extends {step?: {[P in T]?: any} | null}> (state: U) =>
    !isDoneStep(p)(state)

// export const isNotDoneStep = <T extends string> (p: T) =>
//   <U extends {step?: {[P in T]?: any} | null}> (state: U) => {
//     if (!state) {return false}
//     if (!state.step) {return false;}
//     if (!(p in state.step)) {return false}
//     return (state.step[p] as any)['done'] !== true
//   }

// const createIsNotDoingStep = () =>
//   <T extends string> (p: T) =>
//     <U extends {step?: {[P in T]?: any} | null}> (state: U) => {
//       if (!state) {return false}
//       if (!state.step) {return false;}
//       if (!(p in state.step)) {return false}
//       return (state.step[p] as any)['doing'] !== true
//     }

// export const isNotDoingStep = createIsNotDoingStep()
