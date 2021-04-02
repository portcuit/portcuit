import {merge, Observable} from "rxjs";
import {switchMap} from "rxjs/operators";
import {LifecyclePort, Socket, PortMessage, sink, source, PortSourceOrSink, sourceSinkMap, mapProc, fromEventProc, latestMapProc} from "@pkit/core";
import {receiveProc, sendProc} from './processors'

export class HttpClientRemotePort<T> extends LifecyclePort {
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

  circuit() {
    return httpClientRemoteKit<T>(this)
  }

}

const httpClientRemoteKit = <T>(port: HttpClientRemotePort<T>) =>
  merge(
    mapProc(source(port.init), sink(port.es), ({endpoint}) =>
      new EventSource(endpoint)),

    fromEventProc(source(port.es), source(port.terminated), sink(port.event.open), 'open'),
    fromEventProc(source(port.es), source(port.terminated), sink(port.event.message), 'message'),
    fromEventProc(source(port.es), source(port.terminated), sink(port.event.error), 'error'),

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

