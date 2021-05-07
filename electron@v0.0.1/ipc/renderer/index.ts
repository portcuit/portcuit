import {source, sink, Socket} from 'pkit/core'
import {receiveSink, sendMainSink, PDSent} from './processors'

export {PDSent} from './processors'

export class IpcRendererPort {
  sent = new Socket<PDSent>();
}

export const useIpcRendererReceive = receiveSink;

export const useIpcRendererMainSend = (port: IpcRendererPort, channel: string, socks: Socket<any>[]) =>
  sendMainSink(sink(port.sent), channel,
    socks.map(sock =>
      [source(sock), sink(sock)]));
