import {merge} from "rxjs";
import {LifecyclePort, Socket} from "../../../core/";
import {HttpServerContext, HttpServerRestPort} from "../../../http/server/";
import {StatePort} from "../../../core/state/";
import {SpaState} from "../../shared/";
import {ISpaServerRestPort} from "./rest/";

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
      ISpaServerRestPort.circuit(port)
    );
  }
}
Object.assign(SpaServerPort.prototype, ISpaServerRestPort.prototype);
