import {merge} from "rxjs";
import {directProc, mapToProc, ofProc, Port, PortParams, sink, Socket, source} from "@pkit/core";
import {finishStep, StatePort, UpdateBatch} from '@pkit/state'
import {SnabbdomClientPort} from "@pkit/snabbdom/client";
import {SpaCsr, SpaState} from "../../shared/";
import {SpaClientDomPort} from "../dom/";
import {SpaClientBffPort} from "../bff/";

export abstract class SpaClientPort<T extends SpaState> extends Port {
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
  dom = new SpaClientDomPort<T>();
  bff = new SpaClientBffPort();

  initChildPortFlow = (port: this, {vdom, state, params: {csr}, dom}: PortParams<this>) =>
    merge(
      ofProc(sink(port.vdom.init), vdom),
      ofProc(sink(port.state.init), state),
      ofProc(sink(port.bff.init), csr),
      ofProc(sink(port.dom.init), dom)
    )

  startStateFlow = (port: this) =>
    mapToProc(source(port.state.init),
      sink<UpdateBatch<SpaState>>(port.state.update),
      [finishStep('init')])

  bffUpdateFlow = (port: this) =>
    directProc(source(port.bff.batch), sink(port.state.update))

  flow () {
    return merge(
      super.flow(),
      this.state.flow(),
      this.vdom.flow(),
      this.dom.flow(),
      this.bff.flow(),
    )
  }
}
