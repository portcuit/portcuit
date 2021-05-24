import {StepState} from "@pkit/core";

export type SpaState = {
  flow: {
    init: StepState;
    api: StepState;
    render: StepState;
    hydration: StepState;
  }
}

export namespace SpaState {
  export const initialState = (): SpaState =>
    ({
      flow: {
        init: StepState.initialState(),
        api: StepState.initialState(),
        render: StepState.initialState(),
        hydration: StepState.initialState()
      }
    })
}