import {merge} from "rxjs";
import {Port, Socket} from "@pkit/core";
import {StatePort} from '@pkit/state'
import {HttpServerContext, HttpServerRestPort} from "@pkit/http/server";
import {SpaState} from "@pkit/spa";
import {ISpaServerRestPort, ISpaServerLogicPort} from "./mixins/";

export * from './mixins/'

export abstract class SpaServerPort<T extends SpaState> extends Port {
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
      ISpaServerLogicPort.flow({...ISpaServerLogicPort.prototype, ...port}),
      ISpaServerRestPort.flow({...ISpaServerRestPort.prototype, ...port})
    );
  }
}