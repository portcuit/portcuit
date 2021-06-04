import {merge} from "rxjs";
import {Port, Socket, PortMessage, sink, source, PortSourceOrSink, sourceSinkMap, mapProc, latestMapProc, cycleFlow, ofProc, fromEventProc} from "@pkit/core";
import {receiveProc, sendProc} from './processors'

export class HttpClientRemotePort<T> extends Port {
  init = new Socket<{
    endpoint: string;
    mapping: PortSourceOrSink<T>
  }>();
  es = new Socket<EventSource>();
  msg = new Socket<PortMessage<any>>();
  event = new class {
    open = new Socket<MessageEvent>();
    message = new Socket<MessageEvent>();
    error = new Socket<MessageEvent>();
  }

  flow() {
    return cycleFlow(this, 'init', 'terminated', {
      esInstanceFlow: (port, {endpoint}) =>
        ofProc(sink(port.es), new EventSource(endpoint)),

      eventFlow: (port) =>
        merge(...Object.entries(port.event).map(([name, sock]) => 
          fromEventProc(source(port.es), sink(sock), name))),

      msgFlow: (port) =>
        mapProc(source(port.event.message), sink(port.msg), ({data}) =>
          JSON.parse(data)),

      sendFlow: (port, {endpoint, mapping}, [sourceMap, sinkMap] = sourceSinkMap(mapping)) =>
        merge(
          receiveProc(source(port.msg), sinkMap),
          sendProc(sink(port.debug), sink(port.err), endpoint, sourceMap)
        ),

      terminateFlow: (port) =>
        latestMapProc(source(port.terminate), sink(port.terminated),
          [source(port.es)], ([, es]) =>
          es.close())
    })
  }
}
