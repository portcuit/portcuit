import {merge} from "rxjs";
import {Port, PortParams, Socket} from "@pkit/core";
import {StatePort} from '@pkit/state'
import {SnabbdomClientPort} from "@pkit/snabbdom/client";
import {SpaCsr, SpaState} from "../../shared/";
import {SpaClientDomPort} from "../dom/";
import {SpaClientBffPort} from "../bff/";
import {ISpaClientLogicPort} from "./mixins/logic";

export abstract class SpaClientPort<T extends SpaState> extends Port {
  init = new Socket<{
    state: T;
    vdom: PortParams<SnabbdomClientPort>;
    dom: PortParams<SpaClientDomPort>;
    params: {
      csr: SpaCsr
    }
  }>();
  state: Omit<StatePort<T>, 'patchFlow'> = new StatePort<T>();
  vdom = new SnabbdomClientPort();
  dom = new SpaClientDomPort();
  bff = new SpaClientBffPort();

  flow() {
    return merge(
      this.state.flow(),
      this.vdom.flow(),
      this.dom.flow(),
      this.bff.flow(),
      ISpaClientLogicPort.flow(this)
    )
  }
}
