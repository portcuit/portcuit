import {merge} from "rxjs";
import {map} from "rxjs/operators";
import {LifecyclePort, Socket, mapProc, PortMessage, sink, source, fromEventProc, latestMapProc} from "pkit";

export type HttpClientRemoteParams = {
  endpoint: string;
}

export class HttpClientRemotePort extends LifecyclePort<HttpClientRemoteParams> {
  es = new Socket<EventSource>();
  event = new class {
    open = new Socket<MessageEvent>();
    message = new Socket<MessageEvent>();
    error = new Socket<MessageEvent>();
  }
}

export const httpClientRemoteKit = (port: HttpClientRemotePort) =>
  merge(
    mapProc(source(port.init), sink(port.es), ({endpoint}) =>
      new EventSource(endpoint)),

    fromEventProc(source(port.es), sink(port.event.open), 'open'),
    fromEventProc(source(port.es), sink(port.event.message), 'message'),
    fromEventProc(source(port.es), sink(port.event.error), 'error'),

    source(port.event.message).pipe(
      map(({data}) =>
        JSON.parse(data) as PortMessage<any>)),

    latestMapProc(source(port.terminate), sink(port.terminated),
      [source(port.es)], ([,es]) =>
        es.close()),
  )

export const sseClientSendKit = (port: HttpClientRemotePort, socks: Socket<any>[]) =>
  merge(

  )