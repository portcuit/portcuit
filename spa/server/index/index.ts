import {merge} from "rxjs";
import {LifecyclePort, Socket} from "@pkit/core";
import {StatePort} from '@pkit/state'
import {HttpServerContext, HttpServerRestPort} from "@pkit/http/server";
import {SpaState} from "../../shared/";
import {ISpaServerRestPort, ISpaServerLogicPort} from "./mixin/";

export * from './mixin/'

export abstract class SpaServerPort<T extends SpaState> extends LifecyclePort {
  init = new Socket<{
    ctx: HttpServerContext;
    state: T;
  }>();
  state = new StatePort<T>();
  rest = new HttpServerRestPort;

  circuit() {
    const port = this;
    return merge(
      port.state.circuit(),
      port.rest.circuit(),
      ISpaServerLogicPort.circuit(port),
      ISpaServerRestPort.circuit(port)
    );
  }
}
Object.assign(SpaServerPort.prototype, ISpaServerLogicPort.prototype)
Object.assign(SpaServerPort.prototype, ISpaServerRestPort.prototype)
