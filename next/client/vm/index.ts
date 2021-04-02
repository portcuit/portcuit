import {merge} from "rxjs";
import {
  childRemoteWorkerKit, decodePatch, EncodedPatch, latestMapProc,
  LifecyclePort, mapProc,
  mapToProc, Patch,
  sink, Socket,
  source,
  StatePort
} from "@pkit/core";
import {FC} from "@pkit/snabbdom";
import {SnabbdomClientPort} from "@pkit/snabbdom/client";


export class VmPort<T> extends LifecyclePort {
  init = new Socket<FC<T>>();
  state = new StatePort<T>();
  vdom = new SnabbdomClientPort;
  patch = new class {
    encode = new Socket<Patch<T>>();
    decode = new Socket<EncodedPatch>();
  }
}

export const vmKit = <T>(port: VmPort<T>) =>
  merge(
    childRemoteWorkerKit<VmPort<T>>({
      ready: source(port.ready),
      state: {
        data: source(port.state.data),
        init: sink(port.state.init)
      },
      vdom: {
        render: source(port.vdom.render),
        action: sink(port.vdom.action)
      }
    }, port, self as any),
    port.state.circuit(),
    mapProc(source(port.vdom.action), sink(port.state.update), decodePatch),
    latestMapProc(source(port.state.data), sink(port.vdom.render),
      [source(port.init)], ([state, Body]) =>
        Body(state)),
    mapToProc(source(port.init), sink(port.ready))
  )

export default {Port: VmPort, circuit: vmKit}

export type CreateCsr<T> = () => any