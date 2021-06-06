import {merge} from "rxjs";
import {Port, Socket, PortMessage, sink, source, PortSourceOrSink, sourceSinkMap, mapProc, latestMapProc, cycleFlow, ofProc, fromEventProc, Container, PortParams} from "@pkit/core";
import {receiveProc, sendProc} from './lib'

export class HttpClientRemotePort<T> extends Port {
  init = new Socket<{
    endpoint: string;
    mapping: PortSourceOrSink<T>
  }>();
  es = new Socket<EventSource>();
  msg = new Socket<PortMessage<any>>();
  event = new class extends Container {
    open = new Socket<MessageEvent>();
    message = new Socket<MessageEvent>();
    error = new Socket<MessageEvent>();
  }

  esInstanceFlow = (port: this, {endpoint}: PortParams<this>) =>
    ofProc(sink(port.es), new EventSource(endpoint))

  eventFlow = (port: this) =>
    merge(...Object.entries(port.event).map(([name, sock]) =>
      fromEventProc(source(port.es), sink(sock), name)))

  msgFlow = (port: this) =>
    mapProc(source(port.event.message), sink(port.msg), ({data}) =>
      JSON.parse(data))

  sendFlow = (port: this, {endpoint, mapping}: PortParams<this>, [sourceMap, sinkMap] = sourceSinkMap(mapping)) =>
    merge(
      receiveProc(source(port.msg), sinkMap),
      sendProc(sink(port.debug), sink(port.err), endpoint, sourceMap)
    )

  terminateFlow = (port: this) =>
    latestMapProc(source(port.terminate), sink(port.terminated),
      [source(port.es)], ([, es]) =>
        es.close())
}
