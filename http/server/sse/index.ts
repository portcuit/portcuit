import {promisify} from "util";
import {fromEvent, merge, of} from "rxjs";
import {switchMap} from "rxjs/operators";
import {LifecyclePort, sink, Socket, source} from "pkit/core";
import {latestMergeMapProc, mapToProc, directProc} from "pkit/processors";
import {RequestArgs} from "../processors";
import {connectProc} from './processors';

export type SseServerParams = {
  ctx: RequestArgs;
  retry?: number;
}

export class SseServerPort extends LifecyclePort<SseServerParams> {
  ctx = new Socket<RequestArgs>();
  event = new class {
    connect = new Socket<void>();
    close = new Socket<void>();
  };
  json = new Socket<any>();
}

export const sseServerKit = (port: SseServerPort) =>
  merge(
    mapToProc(source(port.event.connect), sink(port.ready)),
    source(port.init).pipe(
      switchMap(({ctx, retry=3000}) =>
        merge(
          connectProc(source(port.ctx), sink(port.event.connect), retry),
          directProc(of(ctx), sink(port.ctx)),
          mapToProc(fromEvent(ctx[0], 'close'), sink(port.event.close)),
        ))),
    latestMergeMapProc(source(port.terminate), sink(port.info),
      [source(port.ctx)], async ([,[,res]]) =>
        ({
          end: await promisify(res.end).call(res)
        })),
    directProc(source(port.event.close), sink(port.terminated))
  )
