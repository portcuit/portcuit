import {filter} from "rxjs/operators";
import {
  directProc,
  ForcePublicPort,
  IFlow,
  mergeMapProc,
  mergeParamsPrototypeKit,
  sink,
  source
} from "@pkit/core";
import {isFinishStep, startStep, UpdateBatch} from '@pkit/state'
import {SpaState} from "@pkit/spa";
import {SpaServerApiPort} from "../";

type ISpaServerApiLogicPort = ForcePublicPort<Omit<SpaServerApiPort<SpaState>, 'circuit'>>
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

const updatePatchDetectKit: Kit = (port) =>
  directProc(source(port.state.update).pipe(
    filter((batch) =>
      batch.some((patches) =>
        [patches].some(isFinishStep('bff'))))),
    sink(port.updateBatch));

const updateBatchResponseKit: Kit = (port) =>
  directProc(source(port.updateBatch), sink(port.rest.response.json));

export namespace ISpaServerApiLogicPort {
  export const prototype = {
    initFlowRestPostKit,
    updatePatchDetectKit,
    updateBatchResponseKit
  };
  export const circuit = (port: ISpaServerApiLogicPort) =>
    mergeParamsPrototypeKit(port, prototype)
}