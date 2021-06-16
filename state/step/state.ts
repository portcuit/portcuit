export type StepState<T = null> = {
  start: boolean
  finish: boolean
  doing: boolean
  done: boolean
  data: T | null
}

export namespace StepState {
  export const initialState = () =>
  ({
    start: false,
    finish: false,
    doing: false,
    done: false,
    data: null
  })
}
