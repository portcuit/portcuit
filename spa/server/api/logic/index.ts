import {filter} from "rxjs/operators";
import {
  directProc,
  ForcePublicPort,
  IKit,
  mergeMapProc,
  mergeParamsPrototypeKit,
  sink,
  source, tuple
} from "../../../../core/";
import {isFinishFlow, startFlow} from "../../../../core/state/";
import {SpaState} from "../../../shared/state";
import {SpaApiPort} from "../";

type ISpaApiLogicPort = ForcePublicPort<Omit<SpaApiPort<SpaState>, 'circuit'>>

type Kit = IKit<ISpaApiLogicPort>;

const initStateRestPostKit: Kit = (port, {state}) =>
  mergeMapProc(source(port.rest.request.body.json), sink(port.state.init),
    async (updateBatch) => {
      if (!(Array.isArray(updateBatch) && updateBatch.every((patches) => Array.isArray(patches)))) {
        throw new Error(`invalid updateBatch: ${JSON.stringify(updateBatch)}`);
      }
      return tuple(state, [...updateBatch, startFlow('api')])
    },
    sink(port.err))

const updatePatchDetectKit: Kit = (port) =>
  directProc(source(port.state.update).pipe(
    filter((batch) =>
      batch.some((patches) =>
        [patches].some(isFinishFlow('api'))))),
    sink(port.updateBatch));

const updateBatchResponseKit: Kit = (port) =>
  directProc(source(port.updateBatch), sink(port.rest.response.json));

export namespace ISpaApiLogicPort {
  export const prototype = {
    initStateRestPostKit,
    updatePatchDetectKit,
    updateBatchResponseKit
  };
  export const circuit = (port: ISpaApiLogicPort) =>
    mergeParamsPrototypeKit(port, prototype)
}