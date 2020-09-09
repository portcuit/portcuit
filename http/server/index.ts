import {promisify} from "util";
import http from 'http';
import {merge, fromEvent} from 'rxjs'
import {delay} from "rxjs/operators";
import {source, sink, Socket, EndpointPort, LifecyclePort} from 'pkit/core'
import {mapProc, latestMapProc, latestMergeMapProc, mergeMapProc, mapToProc} from 'pkit/processors'
import {RunPort, runKit} from 'pkit/run'
import {RequestArgs, remoteReceiveProc, notFoundProc} from './processors'

export * from './processors'
export * from './sse/'
export * from './api/'

export type HttpServerParams = {
  server?: http.ServerOptions;
  listen?: [port?: number, host?: string]
}

export class HttpServerPort extends LifecyclePort<HttpServerParams> {
  run = new RunPort;
  server = new Socket<http.Server>();
  event = new class {
    request = new Socket<RequestArgs>();
  }
}

export const httpServerKit = (port: HttpServerPort) =>
  merge(
    runKit(port.run, port.running),
    mapProc(source(port.init), sink(port.server), ({server={}}) =>
      http.createServer(server)),
    mergeMapProc(source(port.server), sink(port.event.request), (server) =>
      fromEvent<RequestArgs>(server, 'request')),
    mapToProc(source(port.server).pipe(delay(0)), sink(port.ready)),
    latestMergeMapProc(source(port.run.start), sink(port.run.started), [source(port.init), source(port.server)] as const,
      async ([,{listen = []}, server]) =>
        ({
          'server.listen': await promisify(server.listen).apply(server, listen as any),
          listen
        })),
    latestMergeMapProc(source(port.run.stop), sink(port.run.stopped), [source(port.server)],
      ([,server]) =>
        promisify(server.close).call(server)),
  );

export const httpServerRemoteKit = (port: EndpointPort<RequestArgs, void>) =>
  remoteReceiveProc(source(port.req), sink(port.res), sink(port.err));

export const notFoundKit = (port: HttpServerPort) =>
  notFoundProc(source(port.event.request), sink(port.info));
