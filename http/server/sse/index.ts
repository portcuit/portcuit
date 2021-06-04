import {promisify} from "util";
import {fromEvent, of, race} from "rxjs";
import {Port, sink, Socket, source, directProc, mergeMapProc, cycleFlow} from "@pkit/core";
import {HttpServerContext} from "../";

export class HttpServerSsePort extends Port {
  init = new Socket<{
    ctx: HttpServerContext;
    retry?: number;
  }>();
  event = {
    data: new Socket<void>(),
    end: new Socket<void>()
  }
  data = new Socket<string>()

  flow () {
    return cycleFlow(this, 'init', 'terminated', {
      connectFlow: (port, params) =>
        mergeMapProc(of(params), sink(port.ready),
          async ({ctx: [, res], retry = 3000}) => {
            res.writeHead(200, {
              'Content-Type': 'text/event-stream; charset=utf-8',
              'Cache-Control': 'no-cache, no-transform no-store',
              'X-Accel-Buffering': 'no',
              'Connection': 'keep-alive',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Headers': '*',
              'Access-Control-Allow-Methods': '*'
            })
            return await promisify<string, void>(res.write).call(res, `retry: ${retry}\n\n`)
          }),

      pushFlow: (port, {ctx: [, res]}) =>
        mergeMapProc(source(port.data), sink(port.event.data),
          async (data) =>
            await promisify<string, void>(res.write).call(res, `data: ${data}\n\n`)),

      terminateFlow: (port, {ctx: [, res]}) =>
        mergeMapProc(source(port.terminate), sink(port.event.end),
          async () =>
            await promisify<void>(res.end).call(res)),

      terminatedFlow: (port, {ctx: [req]}) =>
        directProc(race(fromEvent(req, 'close'), source(port.event.end)),
          sink(port.terminated))
    })
  }
}
