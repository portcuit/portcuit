import {promisify} from 'util';
import http from 'http';
import {merge} from 'rxjs'
import {withLatestFrom, startWith, switchMap} from 'rxjs/operators'
import {Socket, DeepPartialPort, LifecyclePort, Container, PortParams, ofProc, sink, mapToProc, source, fromEventProc, latestMergeMapProc} from '@pkit/core'
import {HttpServerContext} from './lib'

export * from './lib'

export class HttpServerPort extends LifecyclePort {
  init = new Socket<{
    http: {
      server?: http.ServerOptions;
      listen?: [port?: number, host?: string]
    }
  }>();
  server = new Socket<http.Server>();
  event = new class extends Container {
    request = new Socket<HttpServerContext>();
  }

  constructor (port: DeepPartialPort<HttpServerPort> & {[key: string]: any} = {}) {
    super(port);
  }

  httpServerInstanceFlow = (port: this, {http: {server = {}}}: PortParams<this>) =>
    ofProc(sink(port.server), http.createServer(server))

  httpReadyFlow = (port: this) =>
    mapToProc(source(port.server), sink(port.ready))

  httpEventFlow = (port: this) =>
    fromEventProc(source(port.server), sink(port.event.request), 'request')

  httpStartFlow = (port: this, {http: {listen = []}}: PortParams<this>) =>
    latestMergeMapProc(source(port.start), sink(port.started),
      [source(port.server)], async ([, server]) => ({
        'server.listen': await promisify(server.listen).apply(server, listen as any),
        listen
      }), sink(port.err))

  httpStopFlow = (port: this) =>
    latestMergeMapProc(source(port.stop), sink(port.stopped),
      [source(port.server)], ([, server]) =>
      promisify(server.close).call(server))

  httpTerminateFlow = (port: this) =>
    source(port.terminate).pipe(
      withLatestFrom(source(port.running).pipe(startWith(false))),
      switchMap(([, running]) =>
        running ? merge(
          ofProc(sink(port.stop)),
          mapToProc(source(port.stopped), sink(port.complete))
        ) : ofProc(sink(port.complete))))
}



