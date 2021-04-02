import http from 'http';
import {merge} from 'rxjs'
import {Socket, LifecyclePort, DeepPartialPort, PrivateSocket, PrivateSinkSocket} from '@pkit/core'
import {HttpServerContext} from './processors'
import {IHttpServerPort} from "./circuits/";

export * from './processors'

export class HttpServerPort extends LifecyclePort {
  init = new Socket<{
    server?: http.ServerOptions;
    listen?: [port?: number, host?: string]
  }>();
  server = new PrivateSocket<http.Server>();
  event = new class {
    request = new PrivateSinkSocket<HttpServerContext>();
  }

  constructor(port: DeepPartialPort<HttpServerPort> & Partial<typeof IHttpServerPort.prototype> = {}) {
    super(port);
  }

  circuit () {
    return merge(
      super.circuit(),
      IHttpServerPort.circuit(this)
    )
  }
}


Object.assign(HttpServerPort.prototype, IHttpServerPort.prototype);
