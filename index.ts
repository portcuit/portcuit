import {merge} from 'rxjs'
import {source, sink, LifecyclePort, Socket} from 'pkit/core'
import {directSink} from 'pkit/processors'
import {
  readyEventSink, quitSink,
  windowAllClosedEventSink
} from './processors'

export class ElectronPort extends LifecyclePort {
  quit = new Socket<void>();
  nothing = new Socket<any>();
  windowAllClosed = new Socket<void>();
}

export const useElectron = (port: ElectronPort, lifecycle: LifecyclePort) =>
  merge(
    windowAllClosedEventSink(sink(port.windowAllClosed)),
    quitSink(source(port.quit), sink(port.nothing)),
    readyEventSink(source(lifecycle.init), sink(port.ready)),
    directSink(source(lifecycle.init), sink(port.init)),
  );
