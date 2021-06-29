import {filter, switchMap, takeUntil, toArray} from 'rxjs/operators'
import {directProc, mergeMapProc, sink, Socket, source, Container, mapProc} from "@pkit/core"
import {SpaState} from '@pkit/spa'
import {UpdateBatch, startStep, isStartStep, finishStep, isDoingStep} from "@pkit/state"
import {SpaBackendPort} from "../index/index"

export class SpaBackendBffPort<T extends SpaState> extends SpaBackendPort<T> {
  bffState = new class extends Container {
    update = new Socket<UpdateBatch<T>>()
  }

  bffBufferFilter (state: T) {
    return [state].some(isDoingStep('bff'))
  }

  startBffFlow = (port: this) =>
    mergeMapProc(source<UpdateBatch<T>>(port.rest.request.body.json),
      sink<UpdateBatch<SpaState>>(port.state.update),
      async (batch) => {
        if (!(Array.isArray(batch))) {
          throw new Error(`invalid updateBatch: ${JSON.stringify(batch)}`);
        }
        return [...batch, startStep('bff')]
      }, sink(port.err))

  finishBffFlow = (port: this) =>
    mapProc(source(port.state.data).pipe(
      filter(([, batch]) =>
        batch.some(isStartStep('bff'))),
      switchMap(() =>
        source(port.state.update).pipe(
          takeUntil(source(port.state.data).pipe(
            filter(([state]) => port.bffBufferFilter(state)))),
          toArray()))),
      sink<UpdateBatch<SpaState>>(port.bffState.update),
      (batches) => [
        ...batches.flatMap((batch) => batch),
        finishStep('bff')
      ])

  updateBatchFlow = (port: this) =>
    directProc(source(port.bffState.update), sink(port.rest.response.json))
}