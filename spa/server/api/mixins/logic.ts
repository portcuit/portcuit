import {
  cycleFlow,
  IFlow, IPort,
  mergeMapProc,
  replaceProperty,
  sink,
  source
} from "@pkit/core";
import {startStep, UpdateBatch} from '@pkit/state'
import {SpaState} from "@pkit/spa";
import {SpaServerApiPort} from "../";

type ISpaServerApiLogicPort = IPort<SpaServerApiPort<SpaState>>
type Kit = IFlow<ISpaServerApiLogicPort>;

const initFlowRestPostKit: Kit = (port) =>
  mergeMapProc(source(port.rest.request.body.json), sink(port.state.update),
    async (batch: UpdateBatch<SpaState>) => {
      if (!(Array.isArray(batch) && batch.every((patches) => Array.isArray(patches)))) {
        throw new Error(`invalid updateBatch: ${JSON.stringify(batch)}`);
      }
      return [...batch, startStep('bff')]
    },
    sink(port.err));

export namespace ISpaServerApiLogicPort {
  export const prototype = {
    initFlowRestPostKit,
  };
  export const flow = (port: ISpaServerApiLogicPort & typeof prototype) =>
    cycleFlow(port, 'init', 'terminated', replaceProperty(port, prototype))
}