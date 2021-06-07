import type {Worker as NodeWorker} from 'worker_threads'
import {merge, of, timer} from 'rxjs'
import {map, mergeMap, startWith, switchMap, withLatestFrom} from 'rxjs/operators'
import {
  source,
  sink,
  Socket,
} from '../index/'
import {
  latestMergeMapProc,
  latestMapProc,
  mapToProc,
  ofProc
} from '../processors/'
import {LifecyclePort} from '../lifecycle/'

export * from './remote/'

export class WorkerPort extends LifecyclePort {
  init = new Socket<{
    ctor: typeof Worker;
    args: ConstructorParameters<typeof Worker>
  }>();
  worker = new Socket<Worker | NodeWorker>();
  postMessage = new Socket<any>();

  workerFlow = (port: this) =>
    merge(
      mapToProc(source(port.init), sink(port.ready)),

      latestMapProc(source(port.start), sink(port.worker), [source(port.init)],
        ([, {ctor, args}]) =>
          new ctor(...args)),

      mapToProc(source(port.worker), sink(port.started)),

      latestMapProc(source(port.postMessage), sink(port.debug),
        [source(port.worker)], ([data, worker]) =>
        ({postMessage: worker.postMessage(data), data})),

      latestMergeMapProc(source(port.stop), sink(port.stopped), [source(port.worker)],
        ([, worker]) => {
          worker.postMessage(['terminate']);
          return timer(1000).pipe(
            map(() =>
              worker.terminate()),
            mergeMap((data: any) =>
              data instanceof Promise ? data : of(data)))
        }),

      source(port.terminate).pipe(
        withLatestFrom(source(port.running).pipe(startWith(false))),
        switchMap(([, running]) =>
          running ?
            merge(
              ofProc(sink(port.stop)),
              mapToProc(source(port.stopped), sink(port.complete))
            ) :
            ofProc(sink(port.complete))
        )
      )
    )
}
