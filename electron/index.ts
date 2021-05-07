import {app, shell, BrowserWindow, BrowserWindowConstructorOptions, Tray, Menu} from 'electron'
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
import {fromEvent, merge, of} from "rxjs";
import {delay, filter, map, mergeMap, tap} from "rxjs/operators";

export type ElectronParams = {
  app: ElectronAppParams
} & ElectronBrowserWindowParams

export class ElectronPort extends LifecyclePort<ElectronParams> {
  app = new ElectronAppPort;
  browser = new ElectronBrowserWindowPort;
  shell = new ElectronShellPort;
  tray = new ElectronTrayPort;
}

export const electronKit = (port: ElectronPort) =>
  merge(
    electronAppKit(port.app),
    electronBrowserWindowKit(port.browser),
    electronShellKit(port.shell),
    electronTrayKit(port.tray),
    latestMapProc(source(port.init).pipe(
      mergeMap(() =>
        app.whenReady())), sink(port.browser.init),
      [source(port.init)], ([,args]) =>
        args),
    directProc(source(port.browser.ready), sink(port.ready)),
    directProc(source(port.running), sink(port.browser.running))
  )

export class ElectronContextMenuPort extends LifecyclePort<Parameters<typeof Menu.buildFromTemplate>[0]> {
  contextMenu = new Socket<Menu>();
}

export const electronContextMenuKit = (port: ElectronContextMenuPort) =>
  merge(
    mapProc(source(port.init), sink(port.contextMenu), (arg) =>
      Menu.buildFromTemplate(arg)),
  )

type TrayEvent = [Event & {sender: Tray}, {x: number; y: number; width: number; height: number}]

export class ElectronTrayPort extends LifecyclePort<ConstructorParameters<typeof Tray>> {
  tray = new Socket<Tray>();
  event = new class {
    click = new Socket<TrayEvent>();
    rightClick = new Socket<TrayEvent>();
  };
  contextMenu = new ElectronContextMenuPort;
}

const electronTrayKit = (port: ElectronTrayPort) =>
  merge(
    electronContextMenuKit(port.contextMenu),
    mapProc(source(port.init), sink(port.tray), (args) =>
      new Tray(...args)),
    fromEventProc(source<any>(port.tray), sink(port.event.click), 'click'),
    fromEventProc(source<any>(port.tray), sink(port.event.rightClick), 'right-click')
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
  preventQuitWindowAllClosed?: boolean;
}

export class ElectronAppPort extends LifecyclePort<ElectronAppParams> {
  quit = new Socket<void>();
  event = new class {
    ready = new Socket<void>();
    windowAllClosed = new Socket<void>();
    willQuit = new Socket<Event>();
  }
}

export const electronAppKit = (port: ElectronAppPort) =>
  merge(
    mapToProc(of(true).pipe(
      delay(0),
      mergeMap(() =>
        app.whenReady())), sink(port.event.ready)),

    // mergeMapProc(source(port.init), sink(port.event.ready), async () =>
    //   await app.whenReady()),
    // mergeMapProc(source(port.init).pipe(
    //   filter((params) =>
    //     params && !!params.preventQuitWindowAllClosed)),
    //   sink(port.event.windowAllClosed), () =>
    //     fromEvent<void>(app as any, 'window-all-closed').pipe(
    //       tap((value) =>
    //         value)
    //     )
    // ),

    fromEvent<Event>(app as any, 'will-quit').pipe(map((ev) =>
      sink(port.event.willQuit)(ev))),

    mapProc(source(port.quit), sink(port.info), () =>
      ({quit: app.quit()})),

    // mergeMapProc(source(port.init), sink(port.event.willQuit), (params) =>
    //   fromEvent<Event>(app as any, 'will-quit').pipe(
    //     map((ev) => {
    //       if (params && !!params.preventQuitWindowAllClosed) {
    //         ev.preventDefault()
    //       }
    //       return ev;
    //     }))),

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