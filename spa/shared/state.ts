import {StateFlow} from "@pkit/core/";

export type SpaState = {
  flow: {
    init: StateFlow;
    api: StateFlow;
    render: StateFlow;
    hydration: StateFlow;
  }
}

export namespace SpaState {
  export const initialState = (): SpaState =>
    ({
      flow: {
        init: StateFlow.initialValue(),
        api: StateFlow.initialValue(),
        render: StateFlow.initialValue(),
        hydration: StateFlow.initialValue()
      }
    })
}