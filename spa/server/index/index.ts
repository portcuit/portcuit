import {merge} from "rxjs";
import {mapToProc, ofProc, Port, PortParams, sink, Socket, source} from "@pkit/core";
import {StatePort} from '@pkit/state'
import {HttpServerContext, HttpServerRestPort} from "@pkit/http/server";
import {SpaState} from "@pkit/spa";

export abstract class SpaServerPort<T extends SpaState> extends Port {
  init = new Socket<{
    ctx: HttpServerContext;
    state: T;
  }>();
  state = new StatePort<T>();
  rest = new HttpServerRestPort;

  initStateFlow = (port: this, {state}: PortParams<this>) =>
    ofProc(sink(port.state.init), state)

  initRestFlow = (port: this, {ctx}: PortParams<this>) =>
    ofProc(sink(port.rest.init), ctx)

  completeFlow = (port: this) =>
    mapToProc(source(port.rest.complete), sink(port.complete))

  flow () {
    return merge(
      super.flow(),
      this.state.flow(),
      this.rest.flow()
    );
  }
}