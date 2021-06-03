import {promisify} from "util";
import {merge, race} from "rxjs";
import {filter, map, switchMap, takeUntil} from "rxjs/operators";
import {
  Port,
  PortMessage, PortObject,
  PortSourceOrSink,
  sink,
  Socket,
  source,
  sourceSinkMap,
  sourceSinkMapSocket,
  directProc, mapProc, mapToProc, latestMergeMapProc, PortParams
} from "@pkit/core";
import {HttpServerContext} from "../";
import {HttpServerRestPort} from "../rest/";
import {HttpServerSsePort} from "../sse/";

export class HttpServerRemotePort<T extends PortObject> extends Port {
  init = new Socket<PortParams<HttpServerSsePort>>();
  sse = new HttpServerSsePort;
  rest = new HttpServerRestPort;
  ctx = new Socket<HttpServerContext>();
  msg = new class {
    receive = new Socket<PortMessage<any>>();
    send = new Socket<PortMessage<any>>();
  }

  constructor(public slot: T, mapping: PortSourceOrSink<T>) {
    super();

    // this.injected = (port) =>
    //   merge(
    //     createSendKit(mapping)(port),
    //     createReceiveKit(mapping)(port),
    //     mapProc(source(port.init), sink(port.ctx), ({ctx}) => ctx),
    //   )
  }

  flow () {
    return circuit<T>(this);
  }
}

const circuit = <T>(port: HttpServerRemotePort<T>) =>
  merge(
    port.sse.flow(),
    port.rest.flow(),

    mapToProc(race(source(port.rest.terminated),
      source(port.sse.terminated)),
      sink(port.terminated)),
  )

const createSendKit = <T>(mapping: PortSourceOrSink<T>) =>
  (port: HttpServerRemotePort<T>) =>
    source(port.init).pipe(
      filter(({ctx: [{method}]}) =>
        method === 'GET'),
      switchMap(({ctx, retry}) => {
        const [sourceMap] = sourceSinkMap(mapping);
        const [slotSourceMap, slotSinkMap] = sourceSinkMapSocket(port.slot);

        return merge(
          merge(...Array.from(sourceMap.entries()).map(([path, source$]) =>
            source$.pipe(
              takeUntil(source(port.terminated)),
              map((data) =>
                slotSinkMap.get(path)!(data))))),

          merge(...Array.from(sourceMap.entries()).map(([path]) =>
            slotSourceMap.get(path)!.pipe(
              map((data) =>
                sink(port.msg.send)([path, data]))))),

          latestMergeMapProc(source(port.msg.send), sink(port.info),
            [source(port.ctx)], async ([[path, data], [,res]]) =>
              ({
                send: await promisify<any, void>(res.write).call(res, `data: ${JSON.stringify([path, data])}\n\n`),
                path, data
              }), sink(port.err)),

          mapProc(source(port.ctx), sink(port.sse.init), (ctx) =>
            ({ctx, retry})),
        )
      }));

const createReceiveKit = <T>(mapping: PortSourceOrSink<T>) =>
  (port: HttpServerRemotePort<T>) =>
    source(port.init).pipe(
      filter(({ctx: [{method}]}) =>
        method === 'POST'),
      switchMap(({ctx, retry}) => {
        const [,sinkMap] = sourceSinkMap(mapping);
        const [slotSourceMap, slotSinkMap] = sourceSinkMapSocket(port.slot);

        return merge(
          directProc(source(port.rest.request.body.json), sink(port.msg.receive)),

          mapToProc(source(port.rest.request.body.raw), sink(port.rest.response.json),
            {received: true}),

          source(port.msg.receive).pipe(
            filter(([path]) =>
              sinkMap.has(path)),
            map(([path, data]) =>
              slotSinkMap.get(path)!(data))),

          // directProc(
          //   merge(...Array.from(sinkMap.entries()).map(([path, sink]) =>
          //     slotSourceMap.get(path)!.pipe(
          //       map((data) =>
          //         sink(data))))),
          //   sink(port.expose)),

          directProc(source(port.ctx), sink(port.rest.init)),
        )
      }));

