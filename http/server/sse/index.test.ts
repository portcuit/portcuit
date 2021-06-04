import test from 'ava'
import EventSource from 'eventsource'
import {merge} from 'rxjs'
import {filter} from 'rxjs/operators'
import {cycleFlow, fromEventProc, latestMapProc, mapProc, mapToProc, sink, Socket, source} from "@pkit/core";
import {HttpServerPort} from "../index/";
import {HttpServerSsePort} from "./";

class SseTestHttpServerPort extends HttpServerPort {
  sse = new HttpServerSsePort
  es = {
    es: new Socket<EventSource>(),
    event: {
      data: new Socket<MessageEvent>()
    }
  }

  flow () {
    return merge(
      super.flow(),
      this.sse.flow(),
      cycleFlow(this, 'init', 'terminated', {
        startServerFlow: (port) =>
          mapToProc(source(port.ready), sink(port.start)),

        createEsInstanceFlow: (port, {http: {listen}}, servicePort = listen![0]) =>
          mapProc(source(port.started), sink(port.es.es), () =>
            new EventSource(`http://127.0.0.1:${servicePort}`)),

        receiveEsMessageEventFlow: (port) =>
          fromEventProc(source(port.es.es), sink(port.es.event.data), 'message'),

        initSseFlow: (port) =>
          mapProc(source(port.event.request), sink(port.sse.init), (ctx) =>
            ({ctx})),

        sendDataToEsFromSseFlow: (port) =>
          mapToProc(source(port.sse.ready), sink(port.sse.data), 'hello world'),

        receiveMessageFromSseAndCloseEsFlow: (port) =>
          latestMapProc(source(port.es.event.data).pipe(
            filter(({data}) =>
              data === 'hello world')),
            sink(port.info),
            [source(port.es.es)], ([, es]) => es.close()),

        terminatedFlow: (port) =>
          mapToProc(source(port.sse.terminated), sink(port.terminate))
      })
    )
  }

  log () { }
}

test('ping-pong', async (t) => {
  const logs = await new SseTestHttpServerPort().run({http: {listen: [3999]}}).toPromise();
  t.pass()
})