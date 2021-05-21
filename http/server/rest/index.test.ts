import fetch from 'node-fetch';
import {merge} from "rxjs";
import {filter, toArray} from "rxjs/operators";
import {PortMessage, sink, source, mapProc, mapToProc, mergeMapProc} from "@pkit/core";
import {HttpServerPort, HttpServerRestPort} from "@pkit/http/server";

class HttpServerRestTestPort extends HttpServerRestPort {
  namespace () {
    return '/server/rest/'
  }

  circuit() {
    const port = this;
    return merge(
      super.circuit(),

      mapProc(source(port.request.body.raw), sink(port.response.json), () =>
        ({response: 'ok'}))
    )
  }
}

class HttpServerTestPort extends HttpServerPort {
  namespace () {
    return '/server/'
  }

  circuit() {
    const port = this;
    return merge(
      super.circuit(),

      mapToProc(source(port.ready), sink(port.start)),

      mergeMapProc(source(port.started), sink(port.info), async () => {
        const res = await fetch('http://localhost:18080');
        const body = await res.json();
        return ({fetched: true, body});
      }),

      mergeMapProc(source(port.event.request), sink(port.debug), (ctx) =>
        new HttpServerRestTestPort().run(ctx)),

      mapToProc(source(port.info).pipe(
        filter((data) =>
          !!data.fetched)), sink(port.stop)),

      mapToProc(source(port.stopped), sink(port.terminate))
    )
  }
}

const basicTest = (res: PortMessage<any>[]) => {

  console.log('ok');
}


test('test', async () => {
  let res = await new HttpServerTestPort().run({listen: [18080]}).pipe(toArray()).toPromise()

  basicTest(res);
});
