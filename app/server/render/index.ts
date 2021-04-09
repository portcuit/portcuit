import {AppState} from "@pkit/app";
import {ForcePublicPort, InjectPort, LifecyclePort, PortMessage, PortParams, Socket, StatePort} from "@pkit/core";
import {FC} from "@pkit/snabbdom";
import {SnabbdomServerPort} from "@pkit/snabbdom/server";
import {IAppServerRenderLogicPort} from "./logic/index";
import {merge, Observable} from "rxjs";

export type IAppServerRenderPort = Omit<ForcePublicPort<AppServerRenderPort<AppState>>, 'circuit' | 'constructor'>
export class AppServerRenderPort<T extends AppState> extends LifecyclePort {
  init = new Socket<{
    View: FC<T>;
    snabbdom: PortParams<SnabbdomServerPort>
  }>();
  state: StatePort<T>
  vdom = new SnabbdomServerPort

  constructor(port: InjectPort<AppServerRenderPort<T>, 'state'>) {
    super(port);
    this.state = port.state;
  }

  circuit() {
    return IAppServerRenderLogicPort.circuit(this)
  }
}
Object.assign(AppServerRenderPort.prototype, IAppServerRenderLogicPort.prototype)