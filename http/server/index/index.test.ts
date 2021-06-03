import test from 'ava'
import assert from 'assert'
import {merge} from "rxjs";
import {switchMap, take, toArray} from "rxjs/operators";
import {source, sink, mapToProc, Socket, PortParams} from "@pkit/core";
import {HttpServerPort} from "./";
import {findLogsStopped, findLogsTerminate} from "@pkit/core/port/index.test";

class HttpServerTestPort extends HttpServerPort {
  init = new Socket<{
    scenario: 'A' | 'B' | 'C'
  } & PortParams<HttpServerPort>>();

  circuit() {
    const port = this;
    return merge(
      super.circuit(),
      mapToProc(source(port.ready), sink(port.start)),
      scenarioKit(port)
    )
  }

  log() {}
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
    listen: [18080]
  }).pipe(toArray()).toPromise();

test('terminate while running', async () => {
  let logs = await exec({scenario: 'A'})
  assert(logs.filter(findLogsStopped).length === 1);
  assert(logs.filter(findLogsTerminate).length === 1);
  assert(logs.findIndex(findLogsStopped) > logs.findIndex(findLogsTerminate));
});

test('terminate after stopped', async () => {
  let logs = await exec({scenario: 'B'});
  assert(logs.filter(findLogsStopped).length === 1);
  assert(logs.filter(findLogsTerminate).length === 1);
  assert(logs.findIndex(findLogsStopped) < logs.findIndex(findLogsTerminate));
});

test('it should restart', async () => {
  let logs = await exec({scenario: 'C'});
  assert(logs.filter(findLogsStopped).length === 2);
});
