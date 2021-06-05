import {merge} from 'rxjs';
import {Socket, IPort, IFlow, source, sink} from '../core/'
import {Port} from "../port/";
import {mapToProc} from '../processors/processors'
import {restartProc} from './lib'

type ILifecyclePort = IPort<LifecyclePort>
type Flow = IFlow<ILifecyclePort>

export class LifecyclePort extends Port {
  restartFlow: Flow = (port) =>
    merge(
      mapToProc(source(port.start), sink(port.starting), true),
      mapToProc(source(port.started), sink(port.starting), false),
      mapToProc(source(port.started), sink(port.running), true),
      mapToProc(source(port.stop), sink(port.stopping), true),
      mapToProc(source(port.stop), sink(port.running), false),
      mapToProc(source(port.stopped), sink(port.stopping), false),
      mapToProc(source(port.terminate), sink(port.terminating), true),
      mapToProc(source(port.terminated), sink(port.terminating), false),
      restartProc(source(port.restart), source(port.stopped), source(port.started),
        sink(port.stop), sink(port.restarting), sink(port.start), sink(port.restarted))
    )

  flow () {
    return merge(
      super.flow()
    )
  }
}
