import {merge} from 'rxjs'
import {Container, fromEventProc, latestMapProc, latestMergeMapProc, LifecyclePort, mapToProc, ofProc, Port, PortParams, sink, Socket, source, tuple} from "@pkit/core";
import {BrowserWindow} from "electron";
import {BrowserWindowConstructorOptions} from "electron/main";

export class ElectronBrowserWindowPort extends LifecyclePort {
  init = new Socket<{
    create: BrowserWindowConstructorOptions,
    loadURL?: Parameters<typeof BrowserWindow.prototype.loadURL>
  }>();
  win = new Socket<BrowserWindow>();
  close = new Socket<void>();
  event = new class extends Container {
    close = new Socket<Event>();
    closed = new Socket<void>();
  }

  browserWindowInstanceFlow = (port: this, {create}: PortParams<this>) =>
    ofProc(sink(port.win), new BrowserWindow(create))

  readyFlow = (port: this) =>
    mapToProc(source(port.win), sink(port.ready))

  startFlow = (port: this) =>
    latestMergeMapProc(source(port.start), sink(port.started),
      [source(port.win), source(port.init)] as const, async ([, win, {loadURL: args = tuple('about:blank')}]) =>
      await win.loadURL(...args))

  closeFlow = (port: this) =>
    latestMapProc(source(port.close), sink(port.info),
      [source(port.win)], ([, win]) =>
      ({close: win.close()}))

  eventFlow = (port: this) =>
    merge(...Object.entries(port.event).map(([name, sock]) =>
      fromEventProc(source<any>(port.win), sink(sock), name)))
}
