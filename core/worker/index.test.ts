import assert from 'assert'
import {Worker, isMainThread} from 'worker_threads'
import {merge} from "rxjs";
import {filter, switchMap, toArray} from "rxjs/operators";
import {PortMessage, sink, source, mapToProc, PortLogFilters, PortParams, Socket} from "@pkit/core";
import {WorkerPort} from "./index";

class WorkerTestPort extends WorkerPort {
  init = new Socket<{run: boolean} & PortParams<WorkerPort>>()

  circuit() {
    const port = this;
    return merge(
      super.circuit(),
      source(port.init).pipe(
        switchMap(({run}) =>
          run ?
            merge(
              mapToProc(source(port.ready), sink(port.start)),
              mapToProc(source(port.running).pipe(
                filter((running) =>
                  running)), sink(port.terminate)),
            ) :
            mapToProc(source(port.ready), sink(port.terminate))
        )
      )
    )
  }

  excludes(): PortLogFilters {
    return [([type]) => type === 'worker'];
  }

  includes() { return []; }
}

type Assert = (logs: Array<PortMessage<any>>) => void;
type FindLogs = (log: PortMessage<any>) => boolean

const findTerminated: FindLogs = ([type]) =>
  type === 'terminated'
const findStarted: FindLogs = ([type]) =>
  type === 'started';
const findRunningTrue: FindLogs = ([type, value]) =>
  type === 'running' && value === true;

const itShouldTerminatedWithoutRunning: Assert = (logs) => {
  assert(logs.filter(findTerminated).length === 1);
}

const itShouldTerminatedWithRunning: Assert = (logs) => {
  assert(logs.filter(findStarted).length === 1);
  assert(logs.filter(findRunningTrue).length === 1);
  assert(logs.filter(findTerminated).length === 1);
}

const exec = ({run}: {run: boolean}) =>
  new WorkerTestPort().stream({
    run,
    ctor: Worker as any,
    args: [`${__dirname}/index.test.js`]
  }).pipe(toArray()).toPromise();

const testX = async (label: string, fn: () => Promise<any>) =>
  await fn()

if (isMainThread) {
  test("worker without run", async () => {
    let logs = await exec({run: false});
    itShouldTerminatedWithoutRunning(logs);
  });

  test("worker with run", async () => {
    const logs = await exec({run: true});
    itShouldTerminatedWithRunning(logs);
  })
} else {
  setTimeout(() => console.log('wait 3sec'), 3000);
}
