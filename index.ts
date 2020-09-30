import {app, shell, BrowserWindow, BrowserWindowConstructorOptions} from 'electron'
import {
  directProc, EndpointPort,
  fromEventProc, latestMapProc,
  latestMergeMapProc,
  LifecyclePort,
  mapProc, mapToProc,
  mergeMapProc,
  runKit,
  RunPort,
  sink,
  Socket,
  source, tuple
} from "pkit";
import {merge} from "rxjs";

export type ElectronParams = ElectronBrowserWindowParams

export class ElectronPort extends LifecyclePort<ElectronParams> {
  app = new ElectronAppPort;
  browser = new ElectronBrowserWindowPort;
  shell = new ElectronShellPort;
}

export const electronKit = (port: ElectronPort) =>
  merge(
    electronAppKit(port.app),
    electronBrowserWindowKit(port.browser),
    electronShellKit(port.shell),
    mapToProc(source(port.init), sink(port.app.init)),
    latestMapProc(source(port.app.event.ready), sink(port.browser.init),
      [source(port.init)], ([,args]) =>
        args),
    directProc(source(port.browser.ready), sink(port.ready)),
    directProc(source(port.running), sink(port.browser.running))
  )

export class ElectronShellPort extends LifecyclePort {
  openExternal = new EndpointPort<Parameters<typeof shell.openExternal>, void>()
}

export const electronShellKit = (port: ElectronShellPort) =>
  merge(
    mergeMapProc(source(port.openExternal.req), sink(port.openExternal.res),
      async (args) =>
        await shell.openExternal(...args))
  )

export class ElectronAppPort extends LifecyclePort {
  event = new class {
    ready = new Socket<void>();
  }
}

export const electronAppKit = (port: ElectronAppPort) =>
  merge(
    mergeMapProc(source(port.init), sink(port.event.ready), async () =>
      await app.whenReady())
  )

export type ElectronBrowserWindowParams = {
  create: BrowserWindowConstructorOptions,
  loadURL?: Parameters<typeof BrowserWindow.prototype.loadURL>
}

export class ElectronBrowserWindowPort extends LifecyclePort<ElectronBrowserWindowParams> {
  run = new RunPort;
  win = new Socket<BrowserWindow>();
  event = new class {
    close = new Socket<Event>();
    closed = new Socket<void>();
  }
}

export const electronBrowserWindowKit = (port: ElectronBrowserWindowPort) =>
  merge(
    runKit(port.run, port.running),
    latestMergeMapProc(source(port.run.start), sink(port.run.started),
      [source(port.win), source(port.init)] as const, async ([,win, {loadURL: args = tuple('about:blank')}]) =>
        await win.loadURL(...args)),
    mapProc(source(port.init), sink(port.win), ({create}) =>
      new BrowserWindow(create)),
    mapToProc(source(port.win), sink(port.ready)),
    fromEventProc(source<any>(port.win), sink(port.event.closed), 'close'),
    fromEventProc(source<any>(port.win), sink(port.event.closed), 'closed')
  )