import {promisify} from "util";
import http from 'http';
import {merge} from 'rxjs'
import {startWith, switchMap, withLatestFrom} from "rxjs/operators";
import {
  source,
  sink,
  latestMergeMapProc,
  mapToProc,
  fromEventProc, ofProc, IFlow, IPort, cycleFlow
} from '@pkit/core'
import {HttpServerPort} from "../../";

type IHttpServerLogicPort = IPort<HttpServerPort>
type Flow = IFlow<IHttpServerLogicPort>

export const httpServerInstanceFlow: Flow = (port, {http: {server = {}}}) =>
  ofProc(sink(port.server), http.createServer(server))

export const httpReadyFlow: Flow = (port) =>
  mapToProc(source(port.server), sink(port.ready))

export const httpEventFlow: Flow = (port) =>
  fromEventProc(source(port.server), sink(port.event.request), 'request')

export const httpStartFlow: Flow = (port, {http: {listen = []}}) =>
  latestMergeMapProc(source(port.start), sink(port.started),
    [source(port.server)], async ([, server]) => ({
      'server.listen': await promisify(server.listen).apply(server, listen as any),
      listen
    }))

export const httpStopFlow: Flow = (port) =>
  latestMergeMapProc(source(port.stop), sink(port.stopped),
    [source(port.server)], ([, server]) =>
    promisify(server.close).call(server))

export const httpTerminateFlow: Flow = (port) =>
  source(port.terminate).pipe(
    withLatestFrom(source(port.running).pipe(startWith(false))),
    switchMap(([,running]) =>
      running ? merge(
        ofProc(sink(port.stop)),
        mapToProc(source(port.stopped), sink(port.terminated))
      ) : ofProc(sink(port.terminated))))
