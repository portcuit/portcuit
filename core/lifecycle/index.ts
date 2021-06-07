import {merge} from 'rxjs';
import {Socket, IPort, source, sink} from '../lib'
import {Port, IFlow} from "../port/";
import {mapToProc} from '../processors/'
import {restartProc} from './lib'

type ILifecyclePort = IPort<LifecyclePort>
type Flow = IFlow<ILifecyclePort>

export class LifecyclePort extends Port {
  start = new Socket<any>();
  starting = new Socket<boolean>();
  started = new Socket<any>();
  stop = new Socket<any>();
  stopping = new Socket<boolean>();
  stopped = new Socket<any>();
  restart = new Socket<any>();
  restarting = new Socket<boolean>();
  restarted = new Socket<any>();
  running = new Socket<boolean>();
  terminating = new Socket<boolean>();

  restartFlow: Flow = (port) =>
    merge(
      mapToProc(source(port.start), sink(port.starting), true),
      mapToProc(source(port.started), sink(port.starting), false),
      mapToProc(source(port.started), sink(port.running), true),
      mapToProc(source(port.stop), sink(port.stopping), true),
      mapToProc(source(port.stop), sink(port.running), false),
      mapToProc(source(port.stopped), sink(port.stopping), false),
      mapToProc(source(port.terminate), sink(port.terminating), true),
      mapToProc(source(port.complete), sink(port.terminating), false),
      restartProc(source(port.restart), source(port.stopped), source(port.started),
        sink(port.stop), sink(port.restarting), sink(port.start), sink(port.restarted))
    )
}
