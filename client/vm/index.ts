import {merge} from "rxjs";
import {
  childRemoteWorkerKit, latestMapProc,
  LifecyclePort,
  mapToProc, Portcuit,
  sink,
  source,
  stateKit,
  StatePort
} from "pkit";
import {snabbdomActionPatchKit, SnabbdomPort} from "@pkit/snabbdom/csr";

import {FC} from "@pkit/snabbdom";

export class VmPort<T> extends LifecyclePort<FC<T>> {
  state = new StatePort<T>();
  dom = new SnabbdomPort;
}

export const vmKit = <T>(port: VmPort<T>) =>
  merge(
    childRemoteWorkerKit(port, self as any, [
      port.ready,
      port.state.raw,
      port.dom.render
    ]),
    stateKit(port.state),
    snabbdomActionPatchKit(port.dom, port.state),

    latestMapProc(source(port.state.data), sink(port.dom.render),
      [source(port.init)], ([state, Body]) =>
        Body(state)),
    mapToProc(source(port.init), sink(port.ready))
  )

export default {Port: VmPort, circuit: vmKit}

export type CreateCsr<T> = () => Portcuit<VmPort<T>>