import {
  LifecyclePort,
  mapProc,
  mapToProc,
  sink,
  source,
  workerKit,
  WorkerParams,
  WorkerPort,
  tuple,
  mount,
  directProc
} from 'pkit'
import {merge} from "rxjs";
import {Worker} from "worker_threads";
import {chokidarKit, ChokidarPort} from "@pkit/chokidar";
import {filter, switchMap, takeUntil, throttle, throttleTime, withLatestFrom} from "rxjs/operators";

type DevWorkerRunParams = {
  worker: WorkerParams;
  workerData: {
    src: string;
    params: any;
  };
  watch?: string;
}

class DevWorkerRunPort extends LifecyclePort<DevWorkerRunParams> {
  app = new WorkerPort;
  chokidar = new ChokidarPort;
}

const devWorkerRunKit = (port: DevWorkerRunPort) =>
  merge(
    workerKit(port.app),
    chokidarKit(port.chokidar),
    mapProc(source(port.init), sink(port.app.init), ({worker, workerData}) =>
      ({...worker, args: tuple(`${__dirname}/index.js`, {workerData} as any)})),
    mapToProc(source(port.app.ready), sink(port.app.running), true),
    mapProc(source(port.init).pipe(filter(({watch}) => !!watch)), sink(port.chokidar.init), ({watch}) =>
      tuple(watch!)),
    source(port.app.run.started).pipe(
      switchMap(() =>
        mapToProc(source(port.chokidar.event.all).pipe(
          throttleTime(0), takeUntil(source(port.app.run.stop))),
          sink(port.app.run.restart))))
  )

export const worker_run = (src: string, params?: any) =>
  Object.assign(globalThis,{
    subject$: mount([DevWorkerRunPort, devWorkerRunKit, {worker:{ctor: Worker},workerData:{src, params}} as any])
  })

export const watch_run = (src: string, watch: string, params?: any) =>
  Object.assign(globalThis,{
    subject$: mount([DevWorkerRunPort, devWorkerRunKit, {worker:{ctor: Worker},workerData:{src, params},watch} as any])
  })