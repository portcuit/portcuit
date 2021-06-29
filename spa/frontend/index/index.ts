import {merge} from "rxjs"
import {Container, Port, PortParams, Socket} from "@pkit/core"
import {isFinishStep, StatePort, UpdateBatch} from '@pkit/state'
import {FC} from '@pkit/snabbdom'
import {SnabbdomClientPort} from "@pkit/snabbdom/client"
import {SpaCsr, SpaState} from "../../shared/"
import {SpaFrontendDomPort} from "../dom/"
import * as logic from './mixin/logic'

export abstract class SpaFrontendPort<T extends SpaState> extends Port {
  init = new Socket<{
    state: T;
    vdom: PortParams<SnabbdomClientPort>;
    dom: PortParams<SpaFrontendDomPort>;
    params: {
      csr: SpaCsr
    }
  }>();
  state = new StatePort<T>()
  bffState = new class extends Container {
    update = new Socket<UpdateBatch<T>>()
  }
  vdom = new SnabbdomClientPort()
  dom = new SpaFrontendDomPort<T>()
  render = new Socket<T>()
  view = new Socket<FC>()

  renderDecisionFilter (batch: UpdateBatch<T>): boolean {
    return batch.some(isFinishStep('render'))
  }

  bffDecisionFilter (batch: UpdateBatch<T>): boolean {
    return false
  }

  flow () {
    return merge(
      super.flow(),
      this.state.flow(),
      this.vdom.flow(),
      this.dom.flow()
    )
  }
}

Object.assign(SpaFrontendPort.prototype, logic)