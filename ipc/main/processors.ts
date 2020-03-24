import {ipcMain, BrowserWindow} from 'electron'
import {fromEvent, Observable, merge} from 'rxjs'
import {map, switchMap} from 'rxjs/operators'
import {PortMessage, Sink} from 'pkit/core'

export const receiveSink = (channel: string) =>
  fromEvent(ipcMain, channel).pipe(
    map(([, msg]: [Event, PortMessage<any>]) =>
      msg));

export type SourceSink = [Observable<any>, Sink<any>]
export type PDSendSink = [string, void | boolean]
export const sendSink = (window$: Observable<BrowserWindow>, sent: Sink<PDSendSink>, channel, sourceSinks: SourceSink[]) =>
  window$.pipe(
    switchMap((window) =>
      merge(...sourceSinks.map(([source$, sink]) =>
        source$.pipe(
          map((value) =>
            sink(value)),
          map((msg) =>
            sent([msg[0], window.webContents.send(channel, msg)])))))));
