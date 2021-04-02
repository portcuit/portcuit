import {merge} from 'rxjs'
import {source, sink, PortSourceOrSink, sourceSinkMap} from '@pkit/core'
import type {WorkerPort} from '@pkit/core/worker'
import {sendProc, receiveProc} from './processors'

export const parentRemoteWorkerKit = <T>(mapping: PortSourceOrSink<T>, port: WorkerPort) => {
  const [sourceMap, sinkMap] = sourceSinkMap(mapping);

  return merge(
    receiveProc(source(port.worker), sinkMap),
    sendProc(source(port.worker), sink(port.postMessage), sourceMap)
  );
}
