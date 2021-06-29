import {StepState} from "@pkit/state";

export type SpaState = {
  params: {},
  step: {
    init: StepState
    bff: StepState
    render: StepState
    hydration: StepState
    err: StepState<Error>
  }
}

export namespace SpaState {
  export const initialState = (): SpaState => ({
    params: {},
    step: {
      init: StepState.initialState(),
      bff: StepState.initialState(),
      render: StepState.initialState(),
      hydration: StepState.initialState(),
      err: StepState.initialState()
    }
  })
}