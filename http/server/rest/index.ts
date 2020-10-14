import {promisify} from 'util'
import {OutgoingHttpHeaders, ServerResponse} from "http";
import {mergeDeepLeft} from 'ramda'
import {fromEvent, merge, race} from "rxjs";
import {reduce, takeUntil, map, mergeMap, take, filter} from "rxjs/operators";
import {LifecyclePort, sink, Socket, WritableSocket, ReadableSocket, source, latestMergeMapProc, mapProc, mapToProc, mergeMapProc} from "pkit";
import {HttpServerContext} from "pkit/http/server/processors";

export class HttpServerRestResponse {
  constructor(public body?: any, public init?: ResponseInit) {}

  writeHeadArgs (): Parameters<typeof ServerResponse.prototype.writeHead> {
    const status = this.init?.status ?? 200;

    if (this.init?.statusText && this.init?.headers) {
      return [status, this.init.statusText, this.init.headers] as any;
    } else if (this.init?.headers) {
      return [status, this.init.headers];
    } else {
      return [status];
    }
  }

  endArgs (): Parameters<typeof ServerResponse.prototype.end> {
    return this.body ? [this.body] as any : [] as any;
  }
}

type ResponseInit = {
  status?: number;
  statusText?: string,
  headers?: OutgoingHttpHeaders
}

// JSON.parseが例外の場合があるよ
export class HttpServerRestPort extends LifecyclePort<HttpServerContext> {
  readonly request = new class {
    readonly body = new class {
      readonly raw = new ReadableSocket<Buffer>();
      readonly json = new ReadableSocket<any>();
    }
  }
  readonly response = new class {
    readonly raw = new WritableSocket<HttpServerRestResponse>();
    readonly json = new WritableSocket<any>();
    readonly html = new WritableSocket<string>();
  }

  circuit (port: this) {
    return httpServerRestKit(port);
  }
}

export const makeJsonResponse = (json: any, init?: ResponseInit) =>
  new HttpServerRestResponse(JSON.stringify(json), mergeDeepLeft({
    status: init?.status ?? 200,
    headers: {'Content-Type': 'application/json; charset=utf-8'}
  }, init ?? {}))

export const makeHtmlResponse = (html: string, init? : ResponseInit) =>
  new HttpServerRestResponse(html, mergeDeepLeft({
    status: init?.status ?? 200,
    headers: {'Content-Type': 'text/html; charset=utf-8'}
  }, init ?? {}))

export const httpServerRestKit = (port: HttpServerRestPort) =>
  merge(
    requestKit(port),
    responseKit.call(port, port),

    mapToProc(source(port.init).pipe(
      mergeMap(([req, res]) =>
        race(
          fromEvent(res, 'close'),
          fromEvent(req, 'abort')).pipe(
          take(1)))),
      sink(port.terminated)),
  )

const requestKit = (port: HttpServerRestPort) =>
  merge(
    mergeMapProc(source(port.init), port.request.body.raw.getSink(), ([req]) =>
      fromEvent<Buffer>(req, 'data').pipe(
        takeUntil(fromEvent(req, 'end')),
        reduce((acc, chunk) =>
          acc.concat(chunk), [] as Buffer[]),
        map((chunks) =>
          Buffer.concat(chunks)))),

    mergeMapProc(
      source(port.init).pipe(
        filter(([req]) =>
          `${req.headers['content-type']}`.startsWith('application/json')),
        mergeMap(() =>
          source(port.request.body.raw).pipe(take(1)))),
      port.request.body.json.getSink(), async (body) =>
        JSON.parse(body as any), sink(port.err)),
  );

const responseKit = (port: HttpServerRestPort) =>
  merge(
    mapProc(port.response.json.getSource(), sink(port.response.raw), makeJsonResponse),
    mapProc(port.response.html.getSource(), sink(port.response.raw), makeHtmlResponse),

    latestMergeMapProc(port.response.raw.getSource(), sink(port.info), [source(port.init)],
      async ([response, [, res]]) => ({
        response: {
          writeHead: res.writeHead.apply(res, response.writeHeadArgs()),
          end: await promisify<any, any, any>(res.end).apply(res, response.endArgs())
        }
      }))
  )
