import {FlowState, StateFlow} from "../../core/state/";

export type SpaState = {
  flow: {
    api: StateFlow;
    render: StateFlow;
  }
} & FlowState
