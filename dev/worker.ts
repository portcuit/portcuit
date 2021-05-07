import {SHARE_ENV} from "worker_threads";
import {filter, switchMap, takeUntil, throttleTime} from "rxjs/operators";
import {merge, of} from "rxjs";
import {
  LifecyclePort,
  mapProc,
  mapToProc,
  sink,
  source,
  workerKit,
  WorkerParams,
  WorkerPort,
  tuple, directProc
} from 'pkit'
import {chokidarKit, ChokidarPort} from "@pkit/chokidar";
import {consoleKit, ConsolePort} from "@pkit/console";
import type {IDevPort} from "./index";

type DevWorkerRunParams = {
  worker: Omit<WorkerParams, 'args'>;
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

  circuit(port: this) {
    return devWorkerRunKit(port);
  }
}

const devWorkerRunKit = (port: DevWorkerRunPort) =>
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
          sink(port.app.run.restart)))),
    source(port.terminate).pipe(
      switchMap(() =>
        merge(
          directProc(of(false), sink(port.app.running)),
          mapToProc(source(port.app.run.stopped), sink(port.terminated)))))
  )

export namespace DevWorkerRunPort {
  export type Params = DevWorkerRunParams;
}