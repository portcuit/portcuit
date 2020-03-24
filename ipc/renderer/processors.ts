import {ipcRenderer} from 'electron'
import {fromEvent, Observable, merge} from 'rxjs'
import {map} from 'rxjs/operators'
import {PortMessage, Sink} from 'pkit/core'

export const receiveSink = (channel: string) =>
  fromEvent(ipcRenderer, channel).pipe(
    map(([, msg]: [Event, PortMessage<any>]) =>
      msg));

export type SourceSink = [Observable<any>, Sink<any>]
export type PDSent = [string, void | boolean]
export const sendMainSink = (sent: Sink<PDSent>, channel: string, sourceSinks: SourceSink[]) =>
  merge(...sourceSinks.map(([source$, sink]) =>
    source$.pipe(
      map(value =>
        sink(value)),
      map((msg) =>
        sent([msg[0], ipcRenderer.send(channel, msg)])))));
