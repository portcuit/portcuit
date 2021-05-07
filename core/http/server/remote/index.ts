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
import {HttpServerContext} from "../processors";
import {HttpServerRestPort} from "../rest/";
import {HttpServerSseParams, HttpServerSsePort} from "../sse/";

export type HttpServerRemoteParams<T> = {
  mapping: PortSourceOrSink<T>;
} & HttpServerSseParams

export class HttpServerRemotePort<T, U extends HttpServerRemoteParams<T> = HttpServerRemoteParams<T>> extends LifecyclePort<U> {
  sse = new HttpServerSsePort;
  rest = new HttpServerRestPort;
  ctx = new Socket<HttpServerContext>();
  msg = new class {
    receive = new Socket<PortMessage<any>>();
    send = new Socket<PortMessage<any>>();
  }
  expose = new Socket<PortMessage<any>>();
  constructor(public shadow: T) { super(); }

  circuit (port: HttpServerRemotePort<T>) {
    return circuit<T>(port);
  }
}

const circuit = <T>(port: HttpServerRemotePort<T>) =>
  merge(
    HttpServerSsePort.prototype.circuit(port.sse),
    HttpServerRestPort.prototype.circuit(port.rest),
    sendKit<T>(port),
    receiveKit<T>(port),

    mapProc(source(port.init), sink(port.ctx), ({ctx}) => ctx),

    mapToProc(race(source(port.rest.terminated),
      source(port.sse.terminated)),
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

        mapToProc(source(port.rest.request.body.raw), sink(port.rest.response.json),
          {received: true}),

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

