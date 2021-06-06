import {app} from 'electron';
import {from, merge, fromEvent} from 'rxjs'
import {directProc, mapProc, Port, sink, Socket, source} from "@pkit/core";

export class ElectronAppPort extends Port {
  init = new Socket<{
    preventQuitWindowAllClosed?: boolean;
  }>();
  event = new class {
    ready = new Socket<void>();
    windowAllClosed = new Socket<void>();
    willQuit = new Socket<Event>();
    quit = new Socket<[Event, number]>();
  }

  readyFlow = (port: this) =>
    directProc(from(app.whenReady()), sink(port.event.ready))

  eventFlow = (port: this) =>
    merge(
      directProc(fromEvent<Event>(app as any, 'will-quit'), sink(port.event.willQuit)),
      directProc(fromEvent<[Event, number]>(app as any, 'quit'), sink(port.event.quit))
    )

  completeFlow = (port: this) =>
    mapProc(source(port.terminate), sink(port.complete), () =>
      ({quit: app.quit()}))
}

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

// mergeMapProc(source(port.init), sink(port.event.willQuit), (params) =>
//   fromEvent<Event>(app as any, 'will-quit').pipe(
//     map((ev) => {
//       if (params && !!params.preventQuitWindowAllClosed) {
//         ev.preventDefault()
//       }
//       return ev;
//     }))),
