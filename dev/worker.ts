import {SHARE_ENV} from "worker_threads";
import {filter, switchMap, takeUntil, throttleTime} from "rxjs/operators";
import {merge, Observable} from "rxjs";
import {LifecyclePort, sink, source, tuple, mapProc, mapToProc, Socket, PortParams, PortMessage} from '@pkit/core'
import {WorkerPort} from '@pkit/core/worker'
import {ChokidarPort} from "@pkit/chokidar";
import {consoleKit, ConsolePort} from "@pkit/console";
import type {IDevPort} from "./index";

export class DevWorkerRunPort extends LifecyclePort implements IDevPort {
  init = new Socket<{
    worker: Omit<PortParams<WorkerPort>, 'args'>;
    workerData: {
      src: string;
      params: any;
    };
    watch?: string;
  }>();
  console = new ConsolePort;
  app = new WorkerPort;
  chokidar = new ChokidarPort;

  circuit() {
    return devWorkerRunKit(this);
  }
}

const devWorkerRunKit = (port: DevWorkerRunPort): Observable<any> =>
  merge(
    consoleKit(port.console),
    port.app.circuit(),
    port.chokidar.circuit(),
    mapProc(source(port.init), sink(port.app.init), ({worker, workerData}) =>
      ({...worker, args: tuple(`${__dirname}/index.js`, {env: SHARE_ENV, workerData} as any)})),
    mapToProc(source(port.app.ready), sink(port.app.running), true),
    mapProc(source(port.console.include), sink(port.app.postMessage), (include) =>
      sink(port.console.include)(include)),
    mapProc(source(port.console.exclude), sink(port.app.postMessage), (exclude) =>
      sink(port.console.exclude)(exclude)),
    mapProc(source(port.init).pipe(filter(({watch}) => !!watch)), sink(port.chokidar.init), ({watch}) =>
      tuple(watch!)),
    source(port.app.started).pipe(
      switchMap(() =>
        mapToProc(source(port.chokidar.event.all).pipe(
          throttleTime(0), takeUntil(source(port.app.stop))),
          sink(port.app.restart)))),
    mapToProc(source(port.terminate), sink(port.stop)),
    mapToProc(source(port.stopped), sink(port.terminated))
  )
