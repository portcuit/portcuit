import {promisify} from "util";
import {fromEvent, merge} from "rxjs";
import {Port, sink, Socket, source, latestMergeMapProc, mapToProc, directProc, mergeMapProc} from "@pkit/core";
import {HttpServerContext} from "../";

export class HttpServerSsePort extends Port {
  init = new Socket<{
    ctx: HttpServerContext;
    retry?: number;
  }>();
  ctx = new Socket<HttpServerContext>();
  event = new class {
    connect = new Socket<void>();
    close = new Socket<void>();
  };

  flow () { return circuit(this); }
}

const circuit = (port: HttpServerSsePort) =>
  merge(
    mapToProc(source(port.event.connect), sink(port.ready)),

    connectKit(port),

    mergeMapProc(source(port.init), sink(port.event.close),
      ({ctx: [req]}) =>
        fromEvent<void>(req, 'close')),

    latestMergeMapProc(source(port.terminate), sink(port.info),
      [source(port.init)], async ([,{ctx: [,res]}]) =>
        ({
          end: await promisify(res.end).call(res)
        })),

    directProc(source(port.event.close), sink(port.terminated))
  )

const connectKit = (port: HttpServerSsePort) =>
  mergeMapProc(source(port.init), sink(port.event.connect),
    async ({ctx: [, res], retry=3000}) => {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform no-store',
        'X-Accel-Buffering': 'no',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': '*'
      });

      return await promisify<any, void>(res.write).call(res, `retry: ${retry}\n\n`);
    }
  )
