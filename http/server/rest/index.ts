import {promisify} from 'util'
import {OutgoingHttpHeaders, ServerResponse} from "http";
import {mergeDeepLeft} from 'ramda'
import {fromEvent, merge, race} from "rxjs";
import {reduce, takeUntil, map, mergeMap, take, filter} from "rxjs/operators";
import {LifecyclePort, sink, Socket, source, latestMergeMapProc, mapProc, mapToProc, mergeMapProc} from "@pkit/core";
import {HttpServerContext} from "@pkit/http/server";

export class HttpServerRestPort extends LifecyclePort {
  init = new Socket<HttpServerContext>();
  request = new class {
    body = new class {
      raw = new Socket<Buffer>();
      json = new Socket<any>();
    }
  }
  response = new class {
    raw = new Socket<HttpServerRestResponse>();
    json = new Socket<any>();
    html = new Socket<string>();
  }
  event = new class {
    close = new Socket<{writeHead: ServerResponse, end: void}>();
  }

  circuit () { return circuit(this); }
}

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
  statusText?: string;
  headers?: OutgoingHttpHeaders;
}

const circuit = (port: HttpServerRestPort) =>
  merge(
    requestKit(port),
    responseKit(port),

    mapToProc(source(port.init).pipe(
      mergeMap(([req]) =>
        race(
          source(port.event.close),
          fromEvent(req, 'aborted')).pipe(
          take(1)))),
      sink(port.terminated))
  )

const requestKit = (port: HttpServerRestPort) =>
  merge(
    mergeMapProc(source(port.init), sink(port.request.body.raw), ([req]) =>
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
      sink(port.request.body.json), async (body) =>
        JSON.parse(body as any), sink(port.err))
  );

const responseKit = (port: HttpServerRestPort) =>
  merge(
    mapProc(source(port.response.json), sink(port.response.raw), makeJsonResponse),
    mapProc(source(port.response.html), sink(port.response.raw), makeHtmlResponse),

    latestMergeMapProc(source(port.response.raw), sink(port.event.close), [source(port.init)],
      async ([response, [, res]]) => ({
        writeHead: res.writeHead.apply(res, response.writeHeadArgs()),
        end: await promisify<any, any, any>(res.end).apply(res, response.endArgs())
      }))
  )

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
