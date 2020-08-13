import {merge} from 'rxjs'
import {source, sink, Socket, portPath, LifecyclePort} from 'pkit/core'
import type {WorkerPort} from 'pkit/worker'
import {sendProc, receiveProc} from './processors'

export const parentRemoteWorkerKit = (port: WorkerPort, socks: Socket<any>[], base?: LifecyclePort) =>
  merge(
    receiveProc(source(port.worker), base ? portPath(base) : []),
    sendProc(source(port.worker), source(port.msg), sink(port.debug), sink(port.err),
      socks.map((sock) =>
        [source(sock), sink(sock)]), base ? portPath(base) : []));
