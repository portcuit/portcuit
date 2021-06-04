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
import {HttpServerPort} from "../";

export type IHttpServerPort = IPort<HttpServerPort>
type Flow = IFlow<IHttpServerPort>

const httpServerInstanceFlow: Flow = (port, {http: {server = {}}}) =>
  ofProc(sink(port.server), http.createServer(server))

const httpReadyFlow: Flow = (port) =>
  mapToProc(source(port.server), sink(port.ready))

const httpEventFlow: Flow = (port) =>
  fromEventProc(source(port.server), sink(port.event.request), 'request')

const httpStartFlow: Flow = (port, {http: {listen = []}}) =>
  latestMergeMapProc(source(port.start), sink(port.started),
    [source(port.server)], async ([, server]) => ({
      'server.listen': await promisify(server.listen).apply(server, listen as any),
      listen
    }))

const httpStopFlow: Flow = (port) =>
  latestMergeMapProc(source(port.stop), sink(port.stopped),
    [source(port.server)], ([, server]) =>
    promisify(server.close).call(server))

const httpTerminateFlow: Flow = (port) =>
  source(port.terminate).pipe(
    withLatestFrom(source(port.running).pipe(startWith(false))),
    switchMap(([,running]) =>
      running ? merge(
        ofProc(sink(port.stop)),
        mapToProc(source(port.stopped), sink(port.terminated))
      ) : ofProc(sink(port.terminated))))

export namespace IHttpServerPort {
  export const prototype = {
    httpServerInstanceFlow,
    httpReadyFlow,
    httpEventFlow,
    httpStartFlow,
    httpStopFlow,
    httpTerminateFlow
  };
  export const flow = (port: IHttpServerPort) =>
    cycleFlow(port, 'init', 'terminated', prototype)
}
