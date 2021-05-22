import {filter} from "rxjs/operators";
import {
  directProc,
  ForcePublicPort,
  IKit,
  mergeMapProc,
  mergeParamsPrototypeKit,
  sink,
  source,
  isFinishFlow, startFlow
} from "@pkit/core/";
import {SpaState} from "../../../shared/";
import {SpaServerApiPort} from "../";

type ISpaServerApiLogicPort = ForcePublicPort<Omit<SpaServerApiPort<SpaState>, 'circuit'>>
type Kit = IKit<ISpaServerApiLogicPort>;

const initFlowRestPostKit: Kit = (port) =>
  mergeMapProc(source(port.rest.request.body.json), sink(port.state.update),
    async (batch) => {
      if (!(Array.isArray(batch) && batch.every((patches) => Array.isArray(patches)))) {
        throw new Error(`invalid updateBatch: ${JSON.stringify(batch)}`);
      }
      return [...batch, startFlow('api')]
    },
    sink(port.err));

const updatePatchDetectKit: Kit = (port) =>
  directProc(source(port.state.update).pipe(
    filter((batch) =>
      batch.some((patches) =>
        [patches].some(isFinishFlow('api'))))),
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