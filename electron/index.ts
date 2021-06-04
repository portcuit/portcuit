import {app, shell, BrowserWindow, BrowserWindowConstructorOptions, Tray, Menu} from 'electron'
import {fromEvent, merge, of} from "rxjs";
import {delay, filter, map, mergeMap, tap, switchMap} from "rxjs/operators";
import {
  Port,
  EndpointPort,
  sink,
  Socket,
  source,
  tuple,
  directProc,
  latestMapProc,
  latestMergeMapProc,
  mapProc,
  mapToProc,
  mergeMapProc,
  PortParams,
  cycleFlow,
  ofProc,
  fromEventProc
} from '@pkit/core'

export class ElectronPort extends Port {
  init = new Socket<{
    app: PortParams<ElectronAppPort>
  } & PortParams<ElectronBrowserWindowPort>>();
  app = new ElectronAppPort;
  browser = new ElectronBrowserWindowPort;
  shell = new ElectronShellPort;
  tray = new ElectronTrayPort;

  flow() {
    return electronKit(this);
  }
}

export const electronKit = (port: ElectronPort) =>
  merge(
    electronAppKit(port.app),
    port.browser.flow(),
    electronShellKit(port.shell),
    port.tray.flow(),
    latestMapProc(source(port.init).pipe(
      mergeMap(() =>
        app.whenReady())), sink(port.browser.init),
      [source(port.init)], ([,args]) =>
        args),
    directProc(source(port.browser.ready), sink(port.ready)),
    directProc(source(port.start), sink(port.browser.start)),
    directProc(source(port.browser.started), sink(port.started)),

    mapToProc(source(port.stop), sink(port.browser.close)),
    mapToProc(source(port.browser.event.closed), sink(port.stopped)),

    directProc(source(port.terminate), sink(port.app.quit)),

    mapToProc(source(port.app.event.quit), sink(port.terminated)),
  )

export class ElectronContextMenuPort extends Port {
  init = new Socket<Parameters<typeof Menu.buildFromTemplate>[number]>();
  contextMenu = new Socket<Menu>();
}

export const electronContextMenuKit = (port: ElectronContextMenuPort) =>
  merge(
    mapProc(source(port.init), sink(port.contextMenu), (arg) =>
      Menu.buildFromTemplate(arg)),
  )

type TrayEvent = [Event & {sender: Tray}, {x: number; y: number; width: number; height: number}]

export class ElectronTrayPort extends Port {
  init = new Socket<{tray: ConstructorParameters<typeof Tray>}>();
  tray = new Socket<Tray>();
  event = new class {
    click = new Socket<TrayEvent>();
    rightClick = new Socket<TrayEvent>();
  };
  contextMenu = new ElectronContextMenuPort;

  flow () {
    return merge(
      electronContextMenuKit(this.contextMenu),

      cycleFlow(this, 'init', 'terminated', {
        trayInstanceFlow: (port, {tray}) =>
          ofProc(sink(port.tray), new Tray(...tray)),

        eventFlow: (port) =>
          merge(...Object.entries(port.event).map(([name, sock]) => 
            fromEventProc(source<any>(port.tray), sink(sock), name)))
      })
    )
  }
}

export class ElectronShellPort extends Port {
  init = new Socket<void>();
  openExternal = new EndpointPort<Parameters<typeof shell.openExternal>, void>()
}

export const electronShellKit = (port: ElectronShellPort) =>
  merge(
    mergeMapProc(source(port.openExternal.req), sink(port.openExternal.res),
      async (args) =>
        await shell.openExternal(...args))
  )

export class ElectronAppPort extends Port {
  init = new Socket<{
    preventQuitWindowAllClosed?: boolean;
  }>();
  quit = new Socket<void>();
  event = new class {
    ready = new Socket<void>();
    windowAllClosed = new Socket<void>();
    willQuit = new Socket<Event>();
    quit = new Socket<[Event, number]>();
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

    fromEvent<[Event, number]>(app as any, 'quit').pipe(
      map((data) =>
        sink(port.event.quit)(data))),


    // mergeMapProc(source(port.init), sink(port.event.willQuit), (params) =>
    //   fromEvent<Event>(app as any, 'will-quit').pipe(
    //     map((ev) => {
    //       if (params && !!params.preventQuitWindowAllClosed) {
    //         ev.preventDefault()
    //       }
    //       return ev;
    //     }))),

  )


export class ElectronBrowserWindowPort extends Port {
  init = new Socket<{
    create: BrowserWindowConstructorOptions,
    loadURL?: Parameters<typeof BrowserWindow.prototype.loadURL>
  }>();
  win = new Socket<BrowserWindow>();
  close = new Socket<void>();
  event = new class {
    close = new Socket<Event>();
    closed = new Socket<void>();
  }

  flow () {
    return cycleFlow(this, 'init', 'terminated', {
      browserWindowInstanceFlow: (port, {create}) =>
        ofProc(sink(port.win), new BrowserWindow(create)),

      readyFlow: (port) =>
        mapToProc(source(port.win), sink(port.ready)),

      startFlow: (port) =>
        latestMergeMapProc(source(port.start), sink(port.started),
          [source(port.win), source(port.init)] as const, async ([, win, {loadURL: args = tuple('about:blank')}]) =>
          await win.loadURL(...args)),

      closeFlow: (port) =>
        latestMapProc(source(port.close), sink(port.info),
          [source(port.win)], ([, win]) =>
          ({close: win.close()})),

      eventFlow: (port) =>
        merge(...Object.entries(port.event).map(([name, sock]) =>
          fromEventProc(source<any>(port.win), sink(sock), name)))
    })
  }
}
