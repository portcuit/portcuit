import {StepState} from "@pkit/core";

export type SpaState = {
  step: {
    init: StepState;
    api: StepState;
    render: StepState;
    hydration: StepState;
  }
}

export namespace SpaState {
  export const initialState = (): SpaState =>
    ({
      step: {
        init: StepState.initialState(),
        api: StepState.initialState(),
        render: StepState.initialState(),
        hydration: StepState.initialState()
      }
    })
}