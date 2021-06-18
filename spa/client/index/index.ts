import {merge} from "rxjs"
import {filter} from 'rxjs/operators'
import {Container, latestMergeMapProc, mapProc, mapToProc, ofProc, Port, PortParams, sink, Socket, source} from "@pkit/core"
import {finishStep, isFinishStep, StateData, StatePort, UpdateBatch} from '@pkit/state'
import {FC} from '@pkit/snabbdom'
import {SnabbdomClientPort} from "@pkit/snabbdom/client"
import {SpaCsr, SpaState} from "../../shared/"
import {SpaClientDomPort} from "../dom/"
import {bffProc} from "../lib"

export abstract class SpaClientPort<T extends SpaState> extends Port {
  init = new Socket<{
    state: T;
    vdom: PortParams<SnabbdomClientPort>;
    dom: PortParams<SpaClientDomPort>;
    params: {
      csr: SpaCsr
    }
  }>();
  state = new StatePort<T>()
  bffState = new class extends Container {
    update = new Socket<UpdateBatch<T>>()
  }
  vdom = new SnabbdomClientPort()
  dom = new SpaClientDomPort<T>({hook: {update: this.state.update}})
  render = new Socket<T>()
  view = new Socket<FC>()

  renderDecision ([, , , patch]: StateData<T>): boolean {
    return [patch].some(isFinishStep('render'))
  }

  renderDecisionFlow = (port: this) =>
    mapProc(source(port.state.data).pipe(
      filter((data) =>
        port.renderDecision(data))),
      sink(port.render),
      ([, state]) => state)

  renderFlow = (port: this, {params}: PortParams<this>) =>
    latestMergeMapProc(source(port.render), sink(port.vdom.render),
      [source(port.view)],
      async ([state, BodyView]) =>
        BodyView({state, params}),
      sink(port.err))

  initChildPortFlow = (port: this, {vdom, state, dom}: PortParams<this>) =>
    merge(
      ofProc(sink(port.vdom.init), vdom),
      ofProc(sink(port.state.init), state),
      ofProc(sink(port.dom.init), dom)
    )

  startStateFlow = (port: this) =>
    mapToProc(source(port.state.init),
      sink<UpdateBatch<SpaState>>(port.state.update),
      [finishStep('init')])

  bffFlow = (port: this, {params: {csr: {endpoint}}}: PortParams<this>) =>
    bffProc(source(port.bffState.update), sink(port.state.update), endpoint)

  flow () {
    return merge(
      super.flow(),
      this.state.flow(),
      this.vdom.flow(),
      this.dom.flow()
    )
  }
}
