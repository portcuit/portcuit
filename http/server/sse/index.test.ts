import test from 'ava'
import EventSource from 'eventsource'
import {merge} from 'rxjs'
import {filter} from 'rxjs/operators'
import {fromEventProc, IFlow, latestMapProc, mapProc, mapToProc, PortMessage, sink, Socket, source} from "@pkit/core";
import {HttpServerPort} from "../index/";
import {HttpServerSsePort} from "./";

type Flow = IFlow<SseTestHttpServerPort>

class SseTestHttpServerPort extends HttpServerPort {
  sse = new HttpServerSsePort
  es = {
    es: new Socket<EventSource>(),
    event: {
      data: new Socket<MessageEvent>()
    }
  }

  startServerFlow: Flow = (port) =>
    mapToProc(source(port.ready), sink(port.start))

  createEsInstanceFlow: Flow = (port, {http: {listen}}, servicePort = listen![0]) =>
    mapProc(source(port.started), sink(port.es.es), () =>
      new EventSource(`http://127.0.0.1:${servicePort}`))

  receiveEsMessageEventFlow: Flow = (port) =>
    fromEventProc(source(port.es.es), sink(port.es.event.data), 'message')

  initSsePortFlow: Flow = (port) =>
    mapProc(source(port.event.request), sink(port.sse.init), (ctx) =>
      ({ctx}))

  sendDataToEsFromSseFlow: Flow = (port) =>
    mapToProc(source(port.sse.ready), sink(port.sse.data), 'hello world')

  receiveMessageFromSseAndCloseEsFlow: Flow = (port) =>
    latestMapProc(source(port.es.event.data).pipe(
      filter(({data}) =>
        data === 'hello world')),
      sink(port.info),
      [source(port.es.es)], ([, es]) => es.close())

  terminateFlow: Flow = (port) =>
    mapToProc(source(port.sse.complete), sink(port.terminate))

  flow () {
    return merge(
      super.flow(),
      this.sse.flow(),
    )
  }
}

test('ping-pong', async (t) => {
  const logs = await new SseTestHttpServerPort({
    log: (msg: PortMessage<any>) => t.log(...msg)
  }).run({http: {listen: [3999]}}).toPromise();
  t.pass()
})
