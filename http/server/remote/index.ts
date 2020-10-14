import {promisify} from "util";
import {merge, race} from "rxjs";
import {filter, map, switchMap, takeUntil} from "rxjs/operators";
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
import {directProc, mapProc, mapToProc, latestMergeMapProc} from "pkit/processors";
import {HttpServerRestPort} from "../rest/";
import {httpServerSseKit, HttpServerSseParams, HttpServerSsePort} from "../sse/";
import {HttpServerContext} from "../processors";

export type HttpServerRemoteParams<T> = {
  mapping: PortSourceOrSink<T>;
} & HttpServerSseParams

export class HttpServerRemotePort<T> extends LifecyclePort<HttpServerRemoteParams<T>> {
  sse = new HttpServerSsePort;
  rest = new HttpServerRestPort;
  ctx = new Socket<HttpServerContext>();
  msg = new class {
    receive = new Socket<PortMessage<any>>();
    send = new Socket<PortMessage<any>>();
  }
  expose = new Socket<PortMessage<any>>();
  constructor(public shadow: T) { super(); }
}

export const httpServerRemoteKit = <T>(port: HttpServerRemotePort<T>) =>
  merge(
    httpServerSseKit(port.sse),
    port.rest.httpServerRestKit(port.rest),
    sendKit(port),
    receiveKit(port),

    mapProc(source(port.init), sink(port.ctx), ({ctx}) =>
      ctx),

    mapToProc(race(source(port.rest.terminated), source(port.sse.terminated)),
      sink(port.terminated)),
  )

const sendKit = <T>(port: HttpServerRemotePort<T>) =>
  source(port.init).pipe(
    filter(({ctx: [{method}]}) =>
      method === 'GET'),
    switchMap(({ctx, mapping, retry}) => {
      const [sourceMap] = sourceSinkMap(mapping);
      const [shadowSourceMap, shadowSinkMap] = sourceSinkMapSocket(port.shadow);

      return merge(
        merge(...Array.from(sourceMap.entries()).map(([path, source$]) =>
          source$.pipe(
            takeUntil(source(port.terminated)),
            map((data) =>
              shadowSinkMap.get(path)!(data))))),

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

        mapProc(source(port.ctx), sink(port.sse.init), (ctx) =>
          ({ctx, retry})),
      )
    }));

const receiveKit = <T>(port: HttpServerRemotePort<T>) =>
  source(port.init).pipe(
    filter(({ctx: [{method}]}) =>
      method === 'POST'),
    switchMap(({ctx, mapping, retry}) => {
      const [,sinkMap] = sourceSinkMap(mapping);
      const [shadowSourceMap, shadowSinkMap] = sourceSinkMapSocket(port.shadow);

      return merge(
        directProc(source(port.rest.request.body.json), sink(port.msg.receive)),

        source(port.msg.receive).pipe(
          filter(([path]) =>
            sinkMap.has(path)),
          map(([path, data]) =>
            shadowSinkMap.get(path)!(data))),

        directProc(
          merge(...Array.from(sinkMap.entries()).map(([path, sink]) =>
            shadowSourceMap.get(path)!.pipe(
              map((data) =>
                sink(data))))),
          sink(port.expose)),

        directProc(source(port.ctx), sink(port.rest.init)),
      )
    }));

