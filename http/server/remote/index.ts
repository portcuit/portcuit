import {promisify} from "util";
import {merge, of, race} from "rxjs";
import {filter, map, switchMap} from "rxjs/operators";
import {
  LifecyclePort,
  PortMessage,
  PortSourceOrSink,
  sink,
  Socket,
  source,
  sourceSinkMap,
  sourceSinkMapSocket
} from "pkit/core";
import {directProc, mapProc, mapToProc, latestMergeMapProc, mergeMapProc} from "pkit/processors";
import {httpServerApiKit, HttpServerApiPort} from "../api/";
import {sseServerKit, SseServerParams, SseServerPort} from "../sse/";
import {isNotReserved, RequestArgs} from "../processors";

export type RemoteServerHttpParams<T> = {
  mapping: PortSourceOrSink<T>;
} & SseServerParams

export class RemoteServerHttpPort<T> extends LifecyclePort<RemoteServerHttpParams<T>> {
  sse = new SseServerPort;
  api = new HttpServerApiPort;
  ctx = new Socket<RequestArgs>();
  msg = new class {
    receive = new Socket<PortMessage<any>>();
    send = new Socket<PortMessage<any>>();
  }
  expose = new Socket<PortMessage<any>>();
  constructor(public shadow: T) { super(); }
}

export const remoteServerHttpKit = <T>(port: RemoteServerHttpPort<T>) =>
  merge(
    sseServerKit(port.sse),
    httpServerApiKit(port.api),
    source(port.init).pipe(
      switchMap(({ctx, mapping, retry}) => {
        const [sourceMap, sinkMap] = sourceSinkMap(mapping);
        const [shadowSourceMap, shadowSinkMap] = sourceSinkMapSocket(port.shadow);

        return merge(
          mergeMapProc(source(port.api.body), sink(port.msg.receive), (body) =>
            of(JSON.parse(body)), sink(port.err)),

          source(port.msg.receive).pipe(
            filter(([path]) =>
              sinkMap.has(path)),
            map(([path, data]) =>
              shadowSinkMap.get(path)!(data))),

          merge(...Array.from(sinkMap.entries()).map(([path]) =>
            shadowSourceMap.get(path)!.pipe(
              map((data) =>
                sink(port.expose)([path, data]))))),

          merge(...Array.from(sourceMap.entries()).map(([path]) =>
            shadowSourceMap.get(path)!.pipe(
              map((data) =>
                sink(port.msg.send)([path, data]))))),

          latestMergeMapProc(source(port.msg.send), sink(port.info),
            [source(port.ctx)], async ([[path, data], [,res]]) =>
              ({
                send: await promisify(res.write).call(res, `data: ${JSON.stringify([path, data])}\n\n`),
                path, data
              }), sink(port.err)),

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
