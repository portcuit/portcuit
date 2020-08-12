import {merge} from 'rxjs'
import {source, sink, Socket} from 'pkit/core'
import {receiveProc, sendProc} from './processors'

export const childRemoteWorkerKit = (info: Socket<any>, err: Socket<Error>, parentPort: MessagePort, socks: Socket<any>[]) =>
  merge(
    receiveProc(parentPort),
    sendProc(sink(info), sink(err), parentPort, socks.map((sock) =>
      [source(sock), sink(sock)]))
  );
