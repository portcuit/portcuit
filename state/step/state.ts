export type StepState<T = any, U = any> = {
  start: boolean
  finish: boolean
  doing: boolean
  done: boolean
  data?: T
  status?: U
}

export namespace StepState {
  export const initialState = () =>
  ({
    start: false,
    finish: false,
    doing: false,
    done: false
  })
}
