import {
  cycleFlow, directProc,
  IFlow, IPort,
  mergeMapProc,
  sink,
  source
} from "@pkit/core";
import {startStep, UpdateBatch} from '@pkit/state'
import {SpaState} from "@pkit/spa";
import {SpaServerBffPort} from "../";

type ISpaServerBffLogicPort = IPort<SpaServerBffPort<SpaState>>
type Flow = IFlow<ISpaServerBffLogicPort>;

const startBffFlow: Flow = (port) =>
  mergeMapProc(source(port.rest.request.body.json), sink(port.state.update),
    async (batch: UpdateBatch<SpaState>) => {
      if (!(Array.isArray(batch) && batch.every((patches) => Array.isArray(patches)))) {
        throw new Error(`invalid updateBatch: ${JSON.stringify(batch)}`);
      }
      return [...batch, startStep('bff')]
    },
    sink(port.err));

const updateBatchFlow: Flow = (port) =>
  directProc(source(port.bff.update), sink(port.rest.response.json))

export namespace ISpaServerBffLogicPort {
  export const prototype = {
    startBffFlow,
    updateBatchFlow
  };
  export const flow = (port: ISpaServerBffLogicPort) =>
    cycleFlow(port, 'init', 'terminated', prototype)
}