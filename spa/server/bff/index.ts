import {directProc, mergeMapProc, sink, Socket, source} from "@pkit/core";
import {SpaState} from '@pkit/spa'
import {UpdateBatch, startStep} from "@pkit/state";
import {SpaServerPort} from "../index/";

export class SpaServerBffPort<T extends SpaState> extends SpaServerPort<T> {
  bff = {
    update: new Socket<UpdateBatch<T>>()
  }

  startBffFlow = (port: this) =>
    mergeMapProc(source<UpdateBatch<T>>(port.rest.request.body.json), sink<UpdateBatch<SpaState>>(port.state.update),
      async (batch) => {
        if (!(Array.isArray(batch) && batch.every((patches) => Array.isArray(patches)))) {
          throw new Error(`invalid updateBatch: ${JSON.stringify(batch)}`);
        }
        return [...batch, startStep('bff')]
      }, sink(port.err))

  updateBatchFlow = (port: this) =>
    directProc(source(port.bff.update), sink(port.rest.response.json))
}
