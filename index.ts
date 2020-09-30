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
import {fromEvent, merge} from "rxjs";
import {filter, tap} from "rxjs/operators";

export type ElectronParams = {
  app: ElectronAppParams
} & ElectronBrowserWindowParams

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
    mapProc(source(port.init), sink(port.app.init), ({app}) =>
      app),
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

export type ElectronAppParams = {
  windowAllClosed?: boolean;
}

export class ElectronAppPort extends LifecyclePort<ElectronAppParams> {
  event = new class {
    ready = new Socket<void>();
    windowAllClosed = new Socket<void>();
  }
}

export const electronAppKit = (port: ElectronAppPort) =>
  merge(
    mergeMapProc(source(port.init), sink(port.event.ready), async () =>
      await app.whenReady()),

    // mergeMapProc(source(port.init).pipe(
    //   filter((params) =>
    //     params && !!params.windowAllClosed)),
    //   sink(port.event.windowAllClosed), () =>
    //     fromEvent<void>(app as any, 'window-all-closed').pipe(
    //       tap((value) =>
    //         value)
    //     )
    // ),

    mergeMapProc(source(port.init), sink(port.info), () =>
      fromEvent<Event>(app as any, 'will-quit').pipe(
        tap((ev) =>
          ev.preventDefault())
      )),

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