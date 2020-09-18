import {merge} from "rxjs";
import {
  LifecyclePort, source, sink, Socket,
  latestMapProc,
  mapProc,
  mapToProc,
  workerKit, WorkerParams, WorkerPort, parentRemoteWorkerKit
} from "pkit";
import {snabbdomKit, SnabbdomParams, SnabbdomPort} from "@pkit/snabbdom/csr";
import {VmPort} from "../vm/"

export type ScreenParams = {
  worker: WorkerParams;
  snabbdom: SnabbdomParams;
  state: any
}

export class ScreenPort extends LifecyclePort<ScreenParams> {
  app = new class extends WorkerPort {
    vm = new VmPort;
  };
  snabbdom = new SnabbdomPort;
  state = new Socket<any>();
}

export const screenKit = (port: ScreenPort) =>
  merge(
    useAppKit(port),
    useSnabbdomKit(port),
    lifecycleKit(port)
  )

const lifecycleKit = (port: ScreenPort) =>
  merge(
    latestMapProc(source(port.app.vm.ready), sink(port.app.vm.state.init),
      [source(port.state)], ([,state]) =>
        state),
    mapProc(source(port.init), sink(port.state), ({state}) => state),
  )

const useAppKit = (port: ScreenPort) =>
  merge(
    workerKit(port.app),
    parentRemoteWorkerKit<VmPort<any>>({
      ready: sink(port.app.vm.ready),
      state: {
        raw: sink(port.state),
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
    snabbdomKit(port.snabbdom),
    mapProc(source(port.init), sink(port.snabbdom.init), ({snabbdom}) => snabbdom)
  )