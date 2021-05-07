import {promisify} from "util";
import http from 'http';
import {merge, fromEvent} from 'rxjs'
import {delay} from "rxjs/operators";
import {source, sink, Socket, EndpointPort, LifecyclePort} from 'pkit/core'
import {mapProc, latestMapProc, latestMergeMapProc, mergeMapProc, mapToProc} from 'pkit/processors'
import {RunPort, runKit} from 'pkit/run'
import {HttpServerContext} from './processors'

export * from './processors'
export * from './sse/'
export * from './rest/'
export * from './remote/'

export type HttpServerParams = {
  server?: http.ServerOptions;
  listen?: [port?: number, host?: string]
}

export class HttpServerPort extends LifecyclePort<HttpServerParams> {
  readonly run = new RunPort;
  readonly server = new Socket<http.Server>();
  readonly event = new class {
    readonly request = new Socket<HttpServerContext>();
  }

  circuit (port: this) {
    return httpServerKit(port);
  }
}

const httpServerKit = (port: HttpServerPort) =>
  merge(
    runKit(port.run, port.running),
    mapProc(source(port.init), sink(port.server), ({server={}}) =>
      http.createServer(server)),
    mergeMapProc(source(port.server), sink(port.event.request), (server) =>
      fromEvent<HttpServerContext>(server, 'request')),
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

export namespace HttpServerPort {
  export type Params = HttpServerParams;
}