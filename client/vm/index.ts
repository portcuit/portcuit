import {merge} from "rxjs";
import {
  childRemoteWorkerKit, EncodedPatch, latestMapProc,
  LifecyclePort,
  mapToProc, Patch, Portcuit,
  sink, Socket,
  source,
  stateKit,
  StatePort
} from "pkit";
import {snabbdomActionPatchKit, SnabbdomPort} from "@pkit/snabbdom/csr";

import {FC} from "@pkit/snabbdom";

export class VmPort<T> extends LifecyclePort<FC<T>> {
  state = new StatePort<T>();
  vdom = new SnabbdomPort;
  patch = new class {
    encode = new Socket<Patch<T>>();
    decode = new Socket<EncodedPatch>();
  }
}

export const vmKit = <T>(port: VmPort<T>) =>
  merge(
    childRemoteWorkerKit(port, self as any, [
      port.ready,
      port.state.raw,
      port.vdom.render
    ]),
    stateKit(port.state),
    snabbdomActionPatchKit(port.vdom, port.state),

    latestMapProc(source(port.state.data), sink(port.vdom.render),
      [source(port.init)], ([state, Body]) =>
        Body(state)),
    mapToProc(source(port.init), sink(port.ready))
  )

export default {Port: VmPort, circuit: vmKit}

export type CreateCsr<T> = () => Portcuit<VmPort<T>>