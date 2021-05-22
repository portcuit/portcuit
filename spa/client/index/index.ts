import {merge, Observable} from "rxjs";
import {LifecyclePort, PortMessage, PortParams, Socket, StatePort} from "@pkit/core";
import {SnabbdomClientPort} from "@pkit/snabbdom/client";
import {SpaCsr, SpaState} from "../../shared/";
import {SpaClientDomPort} from "../dom/";
import {SpaClientBffPort} from "../bff/";
import {SpaClientLogicPort} from "./mixin/logic";

export abstract class SpaClientPort<T extends SpaState> extends LifecyclePort {
  init = new Socket<{
    state: T;
    vdom: PortParams<SnabbdomClientPort>;
    dom: PortParams<SpaClientDomPort>;
    params: {
      csr: SpaCsr
    }
  }>();
  state = new StatePort<T>();
  vdom = new SnabbdomClientPort();
  dom = new SpaClientDomPort();
  bff = new SpaClientBffPort();

  circuit() : Observable<PortMessage<any>> {
    const port = this;
    return merge(
      port.state.circuit(),
      port.vdom.circuit(),
      port.dom.circuit(),
      port.bff.circuit(),
      SpaClientLogicPort.circuit(port)
    )
  }
}
Object.assign(SpaClientPort.prototype, SpaClientLogicPort.prototype);