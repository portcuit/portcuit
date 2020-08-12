import {merge, of} from 'rxjs'
import {mergeMap} from 'rxjs/operators'
import {source, sink, Socket, LifecyclePort, PortMessage} from 'pkit/core'
import {mapProc, latestMergeMapProc} from 'pkit/processors'
import {WorkerConstructor, WorkerInfo, createProc} from './processors'

export * from './processors'
export * from './remote/'

export class WorkerPort extends LifecyclePort {
  args = new Socket<WorkerInfo>();
  create = new Socket<void>();
  worker = new Socket<Worker>();
  info = new Socket<any>();
  err = new Socket<Error>();
  msg = new Socket<PortMessage<any>>();
}

export const workerKit = (port: WorkerPort, Worker: WorkerConstructor) =>
  merge(
    createProc(source(port.create), source(port.args), sink(port.worker), sink(port.err), Worker),
    latestMergeMapProc(source(port.terminate), sink(port.terminated), [source(port.worker)],
      ([,worker]) =>
        of(worker.terminate()).pipe(
          mergeMap((data: any) =>
            data instanceof Promise ? data : of(data))))
  );
