import http from 'http';
import {Socket, DeepPartialPort, PrivateSocket, PrivateSinkSocket, LifecyclePort} from '@pkit/core'
import * as logic from "./mixins/logic";
import {HttpServerContext} from './lib'

export * from './lib'

export abstract class HttpServerPort extends LifecyclePort {
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

  constructor(port: DeepPartialPort<HttpServerPort> & Partial<typeof logic> = {}) {
    super(port);
  }
}

Object.assign(HttpServerPort.prototype, logic)

