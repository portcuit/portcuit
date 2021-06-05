import {promisify} from "util";
import {fromEvent, race, from} from "rxjs";
import {Port, sink, Socket, source, directProc, mergeMapProc, PortParams} from "@pkit/core";
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

  connectFlow = (port: this, {ctx: [, res], retry = 3000}: PortParams<this>) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform no-store',
      'X-Accel-Buffering': 'no',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': '*'
    })
    const connect = promisify<string, void>(res.write)
      .call(res, `retry: ${retry}\n\n`)
    return directProc(from(connect), sink(port.ready))
  }

  sendDataFlow = (port: this, {ctx: [, res]}: PortParams<this>) =>
    mergeMapProc(source(port.data), sink(port.event.data),
      async (data) =>
        await promisify<string, void>(res.write).call(res, `data: ${data}\n\n`))

  terminateFlow = (port: this, {ctx: [, res]}: PortParams<this>) =>
    mergeMapProc(source(port.terminate), sink(port.event.end),
      async () =>
        await promisify<void>(res.end).call(res))

  completeFlow = (port: this, {ctx: [req]}: PortParams<this>) =>
    directProc(race(fromEvent(req, 'close'), source(port.event.end)),
      sink(port.terminated))
}
