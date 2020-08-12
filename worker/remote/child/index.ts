import {merge} from 'rxjs'
import {source, sink, Socket} from 'pkit/core'
import {receiveProc, sendProc} from './processors'
import {WorkerPort} from '../../'

export const remoteKit = (port: WorkerPort, parentPort: MessagePort, socks: Socket<any>[]) =>
  merge(
    receiveProc(parentPort),
    sendProc(sink(port.info), sink(port.err), parentPort, socks.map((sock) =>
      [source(sock), sink(sock)]))
  );
