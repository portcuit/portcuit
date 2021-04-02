import {merge} from "rxjs";
import {
  LifecyclePort, source, sink, Socket,
  latestMapProc,
  mapProc,
  mapToProc,
  WorkerPort, parentRemoteWorkerKit, PortParams
} from "@pkit/core";
import {SnabbdomClientPort} from "@pkit/snabbdom/client";
import {VmPort} from "../vm/"

export class ScreenPort extends LifecyclePort {
  init = new Socket<{
    worker: PortParams<WorkerPort>
    snabbdom: PortParams<SnabbdomClientPort>;
    state: any
  }>();
  app = new class extends WorkerPort {
    vm = new VmPort;
  };
  snabbdom = new SnabbdomClientPort;
  state = new Socket<any>();

  circuit() {
    return merge(
      useAppKit(this),
      useSnabbdomKit(this),
      lifecycleKit(this)
    )
  }
}

const lifecycleKit = (port: ScreenPort) =>
  merge(
    latestMapProc(source(port.app.vm.ready), sink(port.app.vm.state.init),
      [source(port.state)], ([,state]) =>
        state),
    mapProc(source(port.init), sink(port.state), ({state}) => state),
  )

const useAppKit = (port: ScreenPort) =>
  merge(
    port.app.circuit(),
    // workerKit(port.app),
    parentRemoteWorkerKit<VmPort<any>>({
      ready: sink(port.app.vm.ready),
      state: {
        data: sink(port.state),
        init: source(port.app.vm.state.init)
      },
      vdom: {
        action: source(port.snabbdom.action),
        event: {
          hashchange: source(port.snabbdom.event.hashchange)
        },
        render: sink(port.snabbdom.render)
      }
    }, port.app),
    mapProc(source(port.init), sink(port.app.init), ({worker}) =>
      worker),
    mapToProc(source(port.app.ready), sink(port.app.running), true)
  )

const useSnabbdomKit = (port: ScreenPort) =>
  merge(
    port.snabbdom.circuit(),
    mapProc(source(port.init), sink(port.snabbdom.init), ({snabbdom}) => snabbdom)
  )