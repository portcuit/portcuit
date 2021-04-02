import {promisify} from "util";
import http from 'http';
import {merge} from 'rxjs'
import {startWith, switchMap, withLatestFrom} from "rxjs/operators";
import {
  source,
  sink,
  mapProc,
  latestMergeMapProc,
  mapToProc,
  fromEventProc, mergePrototypeKit, ofProc, ForcePublicPort
} from '@pkit/core'
import {HttpServerPort} from "../";

export type IHttpServerPort = ForcePublicPort<HttpServerPort>

const httpServerShortKit = (port: IHttpServerPort) =>
  merge(
    mapToProc(source(port.server), sink(port.ready)),
  )

const httpServerEventKit = (port: IHttpServerPort) =>
  merge(
    fromEventProc(source(port.server), source(port.terminated), sink(port.event.request), 'request')
  )

const httpServerEffectKit = (port: IHttpServerPort) =>
  merge(
    mapProc(source(port.init), sink(port.server), ({server={}}) =>
      http.createServer(server)),

    latestMergeMapProc(source(port.start), sink(port.started), [source(port.init), source(port.server)] as const,
      async ([,{listen = []}, server]) =>
        ({
          'server.listen': await promisify(server.listen).apply(server, listen as any),
          listen
        })),

    latestMergeMapProc(source(port.stop), sink(port.stopped), [source(port.server)],
      ([,server]) =>
        promisify(server.close).call(server)),
  )

const httpServerTerminateKit = (port: IHttpServerPort) =>
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
    httpServerShortKit, httpServerEventKit, httpServerEffectKit,
    httpServerTerminateKit
  };
  export const circuit = (port: IHttpServerPort) =>
    mergePrototypeKit(port, prototype)
}
