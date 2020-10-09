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
  directProc, entry
} from 'pkit'
import {merge} from "rxjs";
import {Worker, SHARE_ENV} from "worker_threads";
import {chokidarKit, ChokidarPort} from "@pkit/chokidar";
import {filter, switchMap, takeUntil, throttle, throttleTime, withLatestFrom} from "rxjs/operators";
import {EventEmitter} from "events";
import {consoleKit, ConsolePort} from "@pkit/console";

type DevWorkerRunParams = {
  worker: WorkerParams;
  workerData: {
    src: string;
    params: any;
  };
  watch?: string;
}

class DevWorkerRunPort extends LifecyclePort<DevWorkerRunParams> {
  console = new ConsolePort;
  app = new WorkerPort;
  chokidar = new ChokidarPort;
}

const devWorkerRunKit = (port: DevWorkerRunPort) =>
  merge(
    consoleKit(port.console),
    workerKit(port.app),
    chokidarKit(port.chokidar),
    mapProc(source(port.init), sink(port.app.init), ({worker, workerData}) =>
      ({...worker, args: tuple(`${__dirname}/index.js`, {env: SHARE_ENV, workerData} as any)})),
    mapToProc(source(port.app.ready), sink(port.app.running), true),
    mapProc(source(port.init).pipe(filter(({watch}) => !!watch)), sink(port.chokidar.init), ({watch}) =>
      tuple(watch!)),
    source(port.app.run.started).pipe(
      switchMap(() =>
        mapToProc(source(port.chokidar.event.all).pipe(
          throttleTime(0), takeUntil(source(port.app.run.stop))),
          sink(port.app.run.restart))))
  )

export const run_worker = (src: string, params?: any) => {
  const emitter = new EventEmitter;
  const createLogger = (prefix: string = '') =>
    (type: string, data: any) =>
      emitter.emit('debug', [`${prefix}${type}`, data])
  const subject$ = entry(new DevWorkerRunPort, devWorkerRunKit, {worker:{ctor: Worker},workerData:{src, params}} as any, createLogger('/top/'));
  subject$.next(['console.init', {emitter, include: ['**/*'], exclude: [], createLogger}]);

  return subject$;

  // mount({Port: DevWorkerRunPort, circuit: devWorkerRunKit, params: {worker:{ctor: Worker},workerData:{src, params}} as any})

}






export const run_watch = (src: string, watch: string, params?: any) =>
  Object.assign(globalThis,{
    subject$: mount({Port: DevWorkerRunPort, circuit: devWorkerRunKit, params: {worker:{ctor: Worker},workerData:{src, params},watch} as any})
  })