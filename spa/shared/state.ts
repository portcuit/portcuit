import {FlowState, StateFlow} from "../../core/state/";

export type SpaState = {
  flow: {
    api: StateFlow;
    render: StateFlow;
    hydration: StateFlow;
  }
} & FlowState

export namespace SpaState {
  export const initialState = (base=FlowState.initialState()): SpaState =>
    ({
      ...base,
      flow: {
        ...base.flow,
        api: StateFlow.initialValue(),
        render: StateFlow.initialValue(),
        hydration: StateFlow.initialValue()
      }
    })
}