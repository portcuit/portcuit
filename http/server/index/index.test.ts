import test from 'ava'
import assert from 'assert'
import {merge} from "rxjs";
import {switchMap, take, toArray} from "rxjs/operators";
import {source, sink, mapToProc, Socket, PortParams, PortMessage} from "@pkit/core";
import {HttpServerPort} from "./";

class HttpServerTestPort extends HttpServerPort {
  init = new Socket<{
    scenario: 'A' | 'B' | 'C'
  } & PortParams<HttpServerPort>>();

  flow () {
    const port = this;
    return merge(
      super.flow(),
      mapToProc(source(port.ready), sink(port.start)),
      scenarioKit(port)
    )
  }

  log () { }
}

const scenarioKit = (port: HttpServerTestPort) =>
  source(port.init).pipe(
    switchMap(({scenario}) => {
      switch (scenario) {
        case 'A':
          return mapToProc(source(port.started), sink(port.terminate));
        case 'B':
          return merge(
            mapToProc(source(port.started), sink(port.stop)),
            mapToProc(source(port.stopped), sink(port.terminate))
          )
        case 'C':
          return merge(
            mapToProc(source(port.started).pipe(take(1)), sink(port.restart)),
            mapToProc(source(port.restarted), sink(port.terminate))
          )
      }
    }));

export const exec = (params: Pick<PortParams<HttpServerTestPort>, 'scenario'>) =>
  new HttpServerTestPort().run({
    ...params,
    http: {listen: [18080]}
  }).pipe(toArray()).toPromise();

type FindLogs = (log: PortMessage<any>) => boolean
export const findLogsTerminate: FindLogs = ([type]) =>
  type === 'terminate'
export const findLogsTerminated: FindLogs = ([type]) =>
  type === 'terminated'
export const findLogsStopped: FindLogs = ([type]) =>
  type === 'stopped'

test.serial('terminate while running', async (t) => {
  let logs = await exec({scenario: 'A'})
  assert(logs.filter(findLogsStopped).length === 1);
  assert(logs.filter(findLogsTerminate).length === 1);
  assert(logs.findIndex(findLogsStopped) > logs.findIndex(findLogsTerminate));
  t.pass()
});

test.serial('terminate after stopped', async (t) => {
  let logs = await exec({scenario: 'B'});
  assert(logs.filter(findLogsStopped).length === 1);
  assert(logs.filter(findLogsTerminate).length === 1);
  assert(logs.findIndex(findLogsStopped) < logs.findIndex(findLogsTerminate));
  t.pass()
});

test.serial('it should restart', async (t) => {
  let logs = await exec({scenario: 'C'});
  assert(logs.filter(findLogsStopped).length === 2);
  t.pass()
});
