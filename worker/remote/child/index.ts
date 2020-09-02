import {merge} from 'rxjs'
import {source, sink, Socket} from 'pkit/core'
import {receiveProc, sendProc} from './processors'

type IfsPort = {
  debug: Socket<any>;
  err: Socket<Error>;
}

export const childRemoteWorkerKit = ({debug, err}: IfsPort, parentPort: MessagePort, socks: Socket<any>[]) =>
  merge(
    receiveProc(parentPort),
    sendProc(sink(debug), sink(err), parentPort, socks.map((sock) =>
      [source(sock), sink(sock)]))
  );
