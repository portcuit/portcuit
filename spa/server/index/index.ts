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
  state: Omit<StatePort<T>, 'patchFlow'> = new StatePort<T>();
  rest = new HttpServerRestPort;

  flow() {
    const port = this;
    return merge(
      port.state.flow(),
      port.rest.flow(),
      ISpaServerLogicPort.flow(this),
      ISpaServerRestPort.flow(this)
    );
  }
}