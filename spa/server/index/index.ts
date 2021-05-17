import {merge} from "rxjs";
import {LifecyclePort, Socket} from "../../../core/";
import {HttpServerContext, HttpServerRestPort} from "../../../http/server/";
import {StatePort} from "../../../core/state/";
import {SpaState} from "../../shared/state";
import {ISpaServerRestPort} from "./logic/";

export abstract class SpaPort<T extends SpaState> extends LifecyclePort {
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
      ISpaServerRestPort.circuit(port)
    );
  }
}
Object.assign(SpaPort.prototype, ISpaServerRestPort.prototype);
