import test from 'ava'
import fetch from 'node-fetch';
import {merge} from "rxjs";
import {filter, toArray} from "rxjs/operators";
import {PortMessage, sink, source, mapProc, mapToProc, mergeMapProc, Socket} from "@pkit/core";
import {HttpServerPort, HttpServerRestPort} from "@pkit/http/server";

class HttpServerRestTestPort extends HttpServerRestPort {
  testFlow = (port: this) =>
    mapProc(source(port.request.body.raw), sink(port.response.json), () =>
      ({response: 'ok'}))
}

class HttpServerTestPort extends HttpServerPort {
  response = new Socket<any>();
  namespace () {return '/server/'}

  testFlow = (port: this) => merge(
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
        data?.response === 'ok')),
      sink(port.stop)),

    mapToProc(source(port.stopped), sink(port.terminate)))
}

test('test', async (t) => {
  const logs = await new HttpServerTestPort({
    log: (msg: PortMessage<any>) => t.log(...msg)
  }).run({http: {listen: [18080]}}).pipe(toArray()).toPromise()
  t.pass()
});
