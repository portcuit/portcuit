import {merge} from "rxjs";
import {map, switchMap} from "rxjs/operators";
import {LifecyclePort, Socket, PortMessage, sink, source, PortSourceOrSink, sourceSinkMap} from "pkit/core";
import {mapProc, fromEventProc, latestMapProc} from 'pkit/processors'
import {receiveProc, sendProc} from './processors'

export type HttpClientRemoteParams<T> = {
  endpoint: string;
  mapping: PortSourceOrSink<T>
}

export class HttpClientRemotePort<T> extends LifecyclePort<HttpClientRemoteParams<T>> {
  es = new Socket<EventSource>();
  msg = new Socket<PortMessage<any>>();
  event = new class {
    open = new Socket<MessageEvent>();
    message = new Socket<MessageEvent>();
    error = new Socket<MessageEvent>();
  }
}

export const httpClientRemoteKit = <T>(port: HttpClientRemotePort<T>) =>
  // const [sourceMap, sinkMap] = sourceSinkMap(mapping);

  merge(
    mapProc(source(port.init), sink(port.es), ({endpoint}) =>
      new EventSource(endpoint)),

    fromEventProc(source(port.es), sink(port.event.open), 'open'),
    fromEventProc(source(port.es), sink(port.event.message), 'message'),
    fromEventProc(source(port.es), sink(port.event.error), 'error'),

    mapProc(source(port.event.message), sink(port.msg), ({data}) =>
      JSON.parse(data)),

    source(port.init).pipe(
      switchMap(({endpoint, mapping}) => {
          const [sourceMap, sinkMap] = sourceSinkMap(mapping);
          return merge(
            receiveProc(source(port.msg), sinkMap),
            sendProc(sink(port.debug), sink(port.err), endpoint, sourceMap)
          )
        })),

    latestMapProc(source(port.terminate), sink(port.terminated),
      [source(port.es)], ([, es]) =>
        es.close()),
  )

