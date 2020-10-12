import {promisify} from 'util'
import {OutgoingHttpHeaders} from "http";
import {fromEvent, merge, race} from "rxjs";
import {reduce, takeUntil, map, mergeMap, take} from "rxjs/operators";
import {LifecyclePort, sink, Socket, source, latestMergeMapProc, mapProc, mapToProc, mergeMapProc} from "pkit";
import {HttpServerContext, isNotReserved} from "pkit/http/server/processors";

type HttpServerApiResponse = readonly [status: number, headers: OutgoingHttpHeaders, body: any];

class ContentTypePort {
  json = new Socket<any>();
  html = new Socket<string>();
}

// JSON.parseが例外の場合があるよ
export class HttpServerApiPort extends LifecyclePort<HttpServerContext> implements ContentTypePort {
  json = new Socket<any>();
  html = new Socket<string>();
  notFound = new ContentTypePort;
  body = new Socket<any>();
  request = new class {
    body = new class {
      raw = new Socket<Buffer>();
      json = new Socket<any>();
    }
  }
  response = new Socket<HttpServerApiResponse>();
}

export const httpServerApiKit = (port: HttpServerApiPort) =>
  merge(

    mapProc(source(port.json), sink(port.response), (data) =>
      [200, {'Content-Type': 'application/json; charset=utf-8'}, JSON.stringify(data)] as const),
    mapProc(source(port.html), sink(port.response), (data) =>
      [200, {'Content-Type': 'text/html; charset=utf-8'}, data] as const),
    mapProc(source(port.notFound.json), sink(port.response), (data) =>
      [404, {'Content-Type': 'application/json; charset=utf-8'}, JSON.stringify(data)] as const),
    mapProc(source(port.notFound.html), sink(port.response), (data) =>
      [404, {'Content-Type': 'text/html; charset=utf-8'}, data] as const),

    latestMergeMapProc(source(port.response), sink(port.info), [source(port.init)],
      async ([[statusCode, headers, body], [,res]]) =>
        ({
          response: {
            writeHead: res.writeHead(statusCode, headers),
            end: await promisify<string>(res.end).call(res, body)
          }
        })),

    mergeMapProc(source(port.init), sink(port.body), ([req]) =>
      fromEvent<Buffer>(req, 'data').pipe(
        takeUntil(fromEvent(req, 'end')),
        reduce((acc, chunk) =>
          acc.concat(chunk), [] as Buffer[]),
        map((chunks) =>
          Buffer.concat(chunks)))),
    
    mapToProc(source(port.init).pipe(
      mergeMap(([req, res]) =>
        race(
          fromEvent(res, 'close'),
          fromEvent(req, 'abort')).pipe(
          take(1)))),
      sink(port.terminated)),
  )
