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
import {SpaServerBffPort} from "../";

type ISpaServerBffLogicPort = IPort<SpaServerBffPort<SpaState>>
type Kit = IFlow<ISpaServerBffLogicPort>;

const startBffFlow: Kit = (port) =>
  mergeMapProc(source(port.rest.request.body.json), sink(port.state.update),
    async (batch: UpdateBatch<SpaState>) => {
      if (!(Array.isArray(batch) && batch.every((patches) => Array.isArray(patches)))) {
        throw new Error(`invalid updateBatch: ${JSON.stringify(batch)}`);
      }
      return [...batch, startStep('bff')]
    },
    sink(port.err));

export namespace ISpaServerBffLogicPort {
  export const prototype = {
    startBffFlow,
  };
  export const flow = (port: ISpaServerBffLogicPort & typeof prototype) =>
    cycleFlow(port, 'init', 'terminated', replaceProperty(port, prototype))
}