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
