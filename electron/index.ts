import {merge} from "rxjs";
import {sink, Socket, source, directProc, mapToProc, PortParams, ofProc, LifecyclePort} from '@pkit/core'
import {ElectronAppPort} from './app';
import {ElectronBrowserWindowPort} from './browser_window';
import {ElectronShellPort} from './shell';
import {ElectronTrayPort} from './tray';

export class ElectronPort extends LifecyclePort {
  init = new Socket<{
    app: PortParams<ElectronAppPort>
  } & PortParams<ElectronBrowserWindowPort>>();
  app = new ElectronAppPort;
  browser = new ElectronBrowserWindowPort;
  shell = new ElectronShellPort;
  tray = new ElectronTrayPort;

  initChildPortFlow = (port: this) =>
    merge(
      ofProc(sink(port.app.init)),
      ofProc(sink(port.shell.init)),
    )

  browserWindowInitFlow = (port: this, params: PortParams<this>) =>
    mapToProc(source(port.app.ready), sink(port.browser.init), params)

  wireFlow = (port: this) =>
    merge(
      directProc(source(port.browser.ready), sink(port.ready)),
      directProc(source(port.start), sink(port.browser.start)),
      directProc(source(port.browser.started), sink(port.started)),
      mapToProc(source(port.stop), sink(port.browser.close)),
      mapToProc(source(port.browser.event.closed), sink(port.stopped)),
      directProc(source(port.terminate), sink(port.app.terminate)),
      mapToProc(source(port.app.event.quit), sink(port.complete)),
    )

  flow () {
    return merge(
      super.flow(),
      this.app.flow(),
      this.browser.flow(),
      this.shell.flow(),
      this.tray.flow()
    )
  }
}
