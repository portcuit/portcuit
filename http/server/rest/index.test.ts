import test, {ExecutionContext} from 'ava'
import fetch from 'node-fetch';
import {merge} from "rxjs";
import {filter} from "rxjs/operators";
import {sink, source, mapProc, mapToProc, mergeMapProc, Socket, PortParams} from "@pkit/core";
import {HttpServerPort, HttpServerRestPort} from "@pkit/http/server";

class HttpServerRestTestPort extends HttpServerRestPort {
  testFlow = (port: this) =>
    mapProc(source(port.request.body.raw), sink(port.response.json), () =>
      ({response: 'ok'}))
}

class HttpServerTestPort extends HttpServerPort {
  init = new Socket<{
    t: ExecutionContext
  } & PortParams<HttpServerPort>>()

  response = new Socket<any>();
  namespace () {return '/server/'}

  testFlow = (port: this, {t}: PortParams<this>) => merge(
    mapToProc(source(port.ready), sink(port.start)),

    mergeMapProc(source(port.started), sink(port.response), async () =>
      await (await fetch('http://localhost:18080')).json()),

    mergeMapProc(source(port.event.request), sink(port.debug), (ctx) =>
      new HttpServerRestTestPort({
        namespace: () => '/server/rest/',
        log: port.log
      }).run(ctx)),

    mapToProc(source(port.response).pipe(
      filter((data) =>
        t.is(data?.response, 'ok') === undefined)),
      sink(port.stop)),

    mapToProc(source(port.stopped), sink(port.terminate)))
}

test('test', async (t) => {
  await new HttpServerTestPort({log: t.log})
    .run({http: {listen: [18080]}, t}).toPromise()
  t.pass()
});
