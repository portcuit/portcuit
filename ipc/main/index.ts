import {BrowserWindow} from 'electron'
import {Observable} from 'rxjs'
import {source, sink, Socket, Sink} from 'pkit/core'
import {receiveSink, sendSink, PDSendSink} from './processors'

export class IpcMainPort {
  sent = new Socket<PDSendSink>();
}

export const useIpcMainReceive = receiveSink;

export const useIpcMainSend = (window$: Observable<BrowserWindow>, sentSink: Sink<PDSendSink>, channel: string, socks: Socket<any>[]) =>
  sendSink(window$, sentSink, channel,
    socks.map(sock =>
      [source(sock), sink(sock)]));
