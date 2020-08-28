import type {IncomingMessage} from "http";
import {merge} from "rxjs";
import {promisify} from "util";
import {LifecyclePort, sink, Socket, source} from 'pkit/core'
import {directProc, fromEventProc, latestMapProc, latestMergeMapProc, mapProc, mergeMapProc} from "pkit/processors";
import {RequestArgs} from "../processors";
import {connectProc, sendProc} from "./processors";

export type SseServerParams = {
  args: RequestArgs;
  retry: number;
}

export class SseServerPort extends LifecyclePort<SseServerParams> {
  id = new Socket<string>();
  client = new Socket<IncomingMessage>();
  event = new class {
    close = new Socket<void>();
  }
}

export const sseServerKit = (port: SseServerPort) =>
  merge(
    connectProc(source(port.init), sink(port.id)),
    mapProc(source(port.init), sink(port.client), ({args:[req]}) => req),
    directProc(source(port.id), sink(port.ready)),
    fromEventProc(source(port.client), sink(port.event.close), 'close'),
    latestMergeMapProc(source(port.terminate), sink(port.info), [source(port.init)],
      async ([,{args:[,res]}]) => ({
        end: await promisify<void>(res.end).call(res)
      })),
    latestMapProc(source(port.event.close), sink(port.terminated), [source(port.id)],
      ([,id]) => ({
        sse: id
      })),
  )

export const sseServerRemoteKit = (port: SseServerPort, socks: Socket<any>[]) =>
  merge(
    sendProc(source(port.init), source(port.event.close), sink(port.debug),
      socks.map(sock =>
        [source(sock), sink(sock)])))
