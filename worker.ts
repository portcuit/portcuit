import {LifecyclePort, mapProc, mapToProc, sink, source, workerKit, WorkerParams, WorkerPort, tuple, mount} from 'pkit'
import {merge} from "rxjs";
import {Worker} from "worker_threads";

type Params = {
  worker: WorkerParams;
  workerData: {
    src: string;
    params: any;
  };
}

class Port extends LifecyclePort<Params> {
  app = new WorkerPort;
}

const circuit = (port: Port) =>
  merge(
    workerKit(port.app),
    mapProc(source(port.init), sink(port.app.init), ({worker, workerData}) =>
      ({...worker, args: tuple(`${__dirname}/index.js`, {workerData} as any)})),
    mapToProc(source(port.app.ready), sink(port.app.running), true)
  )

export const worker_run = (src: string, params?: any) =>
  Object.assign(globalThis,{subject$: mount([Port, circuit, {worker:{ctor: Worker},workerData:{src, params}} as any])})