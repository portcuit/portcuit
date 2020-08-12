import {merge, of} from 'rxjs'
import {mergeMap} from 'rxjs/operators'
import {source, sink, Socket, LifecyclePort, PortMessage} from 'pkit/core'
import {mapProc, latestMergeMapProc, RunPort, latestMapProc, runKit} from 'pkit/processors'

export * from './remote/'

export type WorkerParams = {
  ctor: typeof Worker;
  args: ConstructorParameters<typeof Worker>
}

export class WorkerPort extends LifecyclePort {
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
    latestMergeMapProc(source(port.run.stop), sink(port.run.stopped), [source(port.worker)],
      ([,worker]) =>
        of(worker.terminate()).pipe(
          mergeMap((data: any) =>
            data instanceof Promise ? data : of(data))))
  );
