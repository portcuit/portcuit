import type {Worker as NodeWorker} from 'worker_threads'
import {merge, of, timer} from 'rxjs'
import {map, mergeMap} from 'rxjs/operators'
import {source, sink, Socket, LifecyclePort} from 'pkit/core'
import {latestMergeMapProc, latestMapProc, mapToProc} from 'pkit/processors'
import {RunPort, runKit} from 'pkit/run'

export * from './remote/'

export type WorkerParams = {
  ctor: typeof NodeWorker;
  args: ConstructorParameters<typeof NodeWorker>
}

export class WorkerPort extends LifecyclePort<WorkerParams> {
  run = new RunPort;
  worker = new Socket<NodeWorker>();
  postMessage = new Socket<any>();
  err = new Socket<Error>();
}

export const workerKit = (port: WorkerPort) =>
  merge(
    runKit(port.run, port.running),

    latestMapProc(source(port.run.start), sink(port.worker), [source(port.init)],
      ([,{ctor, args}]) =>
        new ctor(...args)),

    mapToProc(source(port.worker), sink(port.run.started)),

    latestMergeMapProc(source(port.run.stop), sink(port.run.stopped), [source(port.worker)],
      ([,worker]) => {
        worker.postMessage(['terminate']);
        return timer(1000).pipe(
          map(() =>
            worker.terminate()),
          mergeMap((data: any) =>
            data instanceof Promise ? data : of(data)))
      }),

    latestMapProc(source(port.postMessage), sink(port.debug),
      [source(port.worker)], ([data, worker]) =>
        ({postMessage: worker.postMessage(data), data})),

    mapToProc(source(port.init), sink(port.ready)),
  );
