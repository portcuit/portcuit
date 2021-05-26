import {merge} from "rxjs";
import {LifecyclePort, PortParams, Socket} from "@pkit/core";
import {StatePort} from '@pkit/state'
import {SnabbdomClientPort} from "@pkit/snabbdom/client";
import {SpaCsr, SpaState} from "../../shared/";
import {SpaClientDomPort} from "../dom/";
import {SpaClientBffPort} from "../bff/";
import {ISpaClientLogicPort} from "./mixins/logic";

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

  circuit() {
    const port = this;
    return merge(
      port.state.circuit(),
      port.vdom.circuit(),
      port.dom.circuit(),
      port.bff.circuit(),
      ISpaClientLogicPort.flow({...ISpaClientLogicPort.prototype, ...port})
    )
  }
}
