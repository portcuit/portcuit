import {promisify} from "util";
import http from 'http';
import {merge} from 'rxjs'
import {startWith, switchMap, withLatestFrom} from "rxjs/operators";
import {
  source,
  sink,
  latestMergeMapProc,
  mapToProc,
  fromEventProc, ofProc, ForcePublicPort, mergeParamsPrototypeKit, IFlow
} from '@pkit/core'
import {HttpServerPort} from "../";

export type IHttpServerPort = ForcePublicPort<HttpServerPort>

const httpServerReadyKit: IFlow<IHttpServerPort> = (port) =>
  mapToProc(source(port.server), sink(port.ready))

const httpServerEventKit: IFlow<IHttpServerPort> = (port) =>
  fromEventProc(source(port.server), source(port.terminated), sink(port.event.request), 'request')

const httpServerEffectKit: IFlow<IHttpServerPort> = (port, {server={}, listen=[]}) =>
  merge(
    ofProc(sink(port.server), http.createServer(server)),

    latestMergeMapProc(source(port.start), sink(port.started), [source(port.server)] as const,
      async ([,server]) =>
        ({
          'server.listen': await promisify(server.listen).apply(server, listen as any),
          listen
        })),

    latestMergeMapProc(source(port.stop), sink(port.stopped), [source(port.server)],
      ([,server]) =>
        promisify(server.close).call(server)),
  )

const httpServerTerminateKit: IFlow<IHttpServerPort> = (port) =>
  source(port.terminate).pipe(
    withLatestFrom(source(port.running).pipe(startWith(false))),
    switchMap(([,running]) =>
      running ? merge(
        ofProc(sink(port.stop)),
        mapToProc(source(port.stopped), sink(port.terminated))
      ) : ofProc(sink(port.terminated))
    )
  )

export namespace IHttpServerPort {
  export const prototype = {
    httpServerReadyKit,
    httpServerEventKit,
    httpServerEffectKit,
    httpServerTerminateKit
  };
  export const flow = (port: IHttpServerPort) =>
    mergeParamsPrototypeKit(port, prototype)
}
