import {merge, of, race} from "rxjs";
import {filter, switchMap} from "rxjs/operators";
import {LifecyclePort, PortMessage, PortSourceOrSink, sink, Socket, source, SourceMap, sourceSinkMap} from "pkit/core";
import {directProc, mapProc, mapToProc} from "pkit/processors";
import {httpServerApiKit, HttpServerApiPort} from "../api/";
import {sseServerKit, SseServerParams, SseServerPort} from "../sse/";
import {isNotReserved, RequestArgs} from "../processors";
import {receiveProc, sendProc} from './processors'

export type RemoteServerHttpParams<T> = {
  mapping: PortSourceOrSink<T>;
} & SseServerParams

export class RemoteServerHttpPort<T> extends LifecyclePort<RemoteServerHttpParams<T>> {
  sse = new SseServerPort;
  api = new HttpServerApiPort;
  ctx = new Socket<RequestArgs>();
  msg = new Socket<PortMessage<any>>();
}

export const remoteServerHttpKit = <T>(port: RemoteServerHttpPort<T>) =>
  merge(
    sseServerKit(port.sse),
    httpServerApiKit(port.api),
    source(port.init).pipe(
      switchMap(({ctx, mapping, retry}) => {
        const [sourceMap, sinkMap] = sourceSinkMap(mapping);
        return merge(
          receiveProc(source(port.api.body),
            sink(port.msg), sink(port.api.json), sink(port.err), sinkMap),
          sendProc(source(port.sse.ctx), sink(port.debug), sink(port.err), sourceMap),
          mapProc(source(port.ctx).pipe(
            filter(([{method}]) =>
              method === 'GET')), sink(port.sse.init), (ctx) =>
            ({ctx, retry})),
          directProc(source(port.ctx).pipe(
            filter(([{method}]) =>
              method === 'POST')), sink(port.api.init)),
          mapToProc(race(
            source(port.ctx).pipe(filter(isNotReserved)),
            source(port.api.terminated),
            source(port.sse.terminated)), sink(port.terminated)),
          directProc(of(ctx), sink(port.ctx))
        )
      }))
  )