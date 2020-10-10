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
  Portcuit
} from 'pkit'
import {merge} from "rxjs";
import {SHARE_ENV} from "worker_threads";
import {chokidarKit, ChokidarPort} from "@pkit/chokidar";
import {filter, switchMap, takeUntil, throttleTime} from "rxjs/operators";
import {consoleKit, ConsolePort} from "@pkit/console";
import type {IDevPort} from "./";

export type DevWorkerRunParams = {
  worker: WorkerParams;
  workerData: {
    src: string;
    params: any;
  };
  watch?: string;
}

export class DevWorkerRunPort extends LifecyclePort<DevWorkerRunParams> implements IDevPort {
  console = new ConsolePort;
  app = new WorkerPort;
  chokidar = new ChokidarPort;
}

export const devWorkerRunKit = (port: DevWorkerRunPort) =>
  merge(
    consoleKit(port.console),
    workerKit(port.app),
    chokidarKit(port.chokidar),
    mapProc(source(port.init), sink(port.app.init), ({worker, workerData}) =>
      ({...worker, args: tuple(`${__dirname}/index.js`, {env: SHARE_ENV, workerData} as any)})),
    mapToProc(source(port.app.ready), sink(port.app.running), true),
    mapProc(source(port.console.include), sink(port.app.postMessage), (include) =>
      sink(port.console.include)(include)),
    mapProc(source(port.console.exclude), sink(port.app.postMessage), (exclude) =>
      sink(port.console.exclude)(exclude)),
    mapProc(source(port.init).pipe(filter(({watch}) => !!watch)), sink(port.chokidar.init), ({watch}) =>
      tuple(watch!)),
    source(port.app.run.started).pipe(
      switchMap(() =>
        mapToProc(source(port.chokidar.event.all).pipe(
          throttleTime(0), takeUntil(source(port.app.run.stop))),
          sink(port.app.run.restart))))
  )

export const portcuit: Portcuit<DevWorkerRunPort> = {Port: DevWorkerRunPort, circuit: devWorkerRunKit}
export namespace portcuit {
  export type Params = DevWorkerRunParams
}
