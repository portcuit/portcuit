import type {BrowserWindow, BrowserWindowConstructorOptions} from 'electron'
import {merge} from 'rxjs';
import {source, sink, Socket} from 'pkit/core'
import {PDLoad, openSink, loadSink, closeSink, readyToShowEventSink, showSink} from './processors'

export class WindowPort {
  open = new Socket<BrowserWindowConstructorOptions>();
  window = new Socket<BrowserWindow>();
  load = new Socket<PDLoad>();
  ready = new Socket<void>();
  close = new Socket<void>();
  show = new Socket<void>();
  nothing = new Socket<any>();
}

export const useWindow = (port: WindowPort) =>
  merge(
    showSink(source(port.show), sink(port.nothing), [source(port.window)]),
    readyToShowEventSink(source(port.window), sink(port.ready)),
    closeSink(source(port.close), sink(port.nothing), [source(port.window)]),
    loadSink(source(port.load), sink(port.nothing), [source(port.window)]),
    openSink(source(port.open), sink(port.window)));
