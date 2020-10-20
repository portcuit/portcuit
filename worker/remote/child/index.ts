import {merge} from 'rxjs'
import {PortSourceOrSink, sourceSinkMap, Socket, sink} from 'pkit/core'
import {receiveProc, sendProc} from './processors'

type IfsPort = {
  debug: Socket<any>;
  err: Socket<Error>;
}

export const childRemoteWorkerKit = <T>(mapping: PortSourceOrSink<T>, {debug, err}: IfsPort, parentPort: MessagePort) => {
  const [sourceMap, sinkMap] = sourceSinkMap(mapping);

  return merge(
    receiveProc(parentPort, sinkMap),
    sendProc(sink(debug), sink(err), parentPort, sourceMap)
  )
}
