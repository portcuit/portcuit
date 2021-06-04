import http from 'http';
import {merge} from 'rxjs'
import {Socket, Port, DeepPartialPort, PrivateSocket, PrivateSinkSocket} from '@pkit/core'
import {HttpServerContext} from './processors'
import {IHttpServerLogicPort} from "./mixins/logic";

export * from './processors'

export abstract class HttpServerPort extends Port {
  init = new Socket<{
    http: {
      server?: http.ServerOptions;
      listen?: [port?: number, host?: string]
    }
  }>();
  server = new PrivateSocket<http.Server>();
  event = new class {
    request = new PrivateSinkSocket<HttpServerContext>();
  }

  constructor(port: DeepPartialPort<HttpServerPort> & Partial<typeof IHttpServerLogicPort.prototype> = {}) {
    super(port);
  }

  flow () {
    return merge(
      super.flow(),
      IHttpServerLogicPort.flow(this)
    )
  }
}

