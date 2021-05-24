import {StepState} from "@pkit/state";

export type SpaState = {
  step: {
    init: StepState;
    bff: StepState;
    render: StepState;
    hydration: StepState;
  }
}

export namespace SpaState {
  export const initialState = (): SpaState =>
    ({
      step: {
        init: StepState.initialState(),
        bff: StepState.initialState(),
        render: StepState.initialState(),
        hydration: StepState.initialState()
      }
    })
}