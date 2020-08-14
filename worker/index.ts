import {merge, of, timer} from 'rxjs'
import {map, mergeMap} from 'rxjs/operators'
import {source, sink, Socket, LifecyclePort, PortMessage} from 'pkit/core'
import {latestMergeMapProc, latestMapProc, mapToProc} from 'pkit/processors'
import {RunPort, runKit} from 'pkit/run'

export * from './remote/'

export type WorkerParams = {
  ctor: typeof Worker;
  args: ConstructorParameters<typeof Worker>
}

export class WorkerPort extends LifecyclePort<WorkerParams> {
  run = new RunPort;
  worker = new Socket<Worker>();
  err = new Socket<Error>();
  msg = new Socket<PortMessage<any>>();
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
        return timer(100).pipe(
          map(() =>
            worker.terminate()),
          mergeMap((data: any) =>
            data instanceof Promise ? data : of(data))
        )
      }),
    mapToProc(source(port.init), sink(port.ready)),
  );
