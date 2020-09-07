import {OutgoingHttpHeaders} from "http";
import {promisify} from 'util'
import type {VNode} from 'snabbdom/vnode'
import 'snabbdom-to-html'
import init from 'snabbdom-to-html/init'
import {fromEvent, merge} from "rxjs";
import {filter, reduce, takeUntil, map} from "rxjs/operators";
import {LifecyclePort, sink, Socket, source} from "pkit/core";
import {latestMergeMapProc, mapProc, mapToProc, mergeMapProc} from "pkit/processors";
import {RequestArgs, isNotReserved} from "pkit/http/server/processors";
import {selectorModule} from '@pkit/snabbdom/ssr/modules/selector'
import {jsxModule} from '@pkit/snabbdom/ssr/modules/jsx'
import {classNamesModule} from '@pkit/snabbdom/ssr/modules/classNames'

const toHTML = init([selectorModule, jsxModule, classNamesModule]);

type ApiResponse = readonly [status: number, headers: OutgoingHttpHeaders, body: any];

class ContentTypePort {
  json = new Socket<any>();
  html = new Socket<string>();
  vnode = new Socket<VNode>();
}

export class HttpServerApiPort extends LifecyclePort<RequestArgs> implements ContentTypePort {
  json = new Socket<any>();
  html = new Socket<string>();
  vnode = new Socket<VNode>();
  notFound = new ContentTypePort;
  body = new Socket<any>();
  terminate = new Socket<ApiResponse>();
}

export const httpServerApiKit = (port: HttpServerApiPort) =>
  merge(
    mapProc(source(port.json), sink(port.terminate), (data) =>
      [200, {'Content-Type': 'application/json; charset=utf-8'}, JSON.stringify(data)] as const),
    mapProc(source(port.html), sink(port.terminate), (data) =>
      [200, {'Content-Type': 'text/html; charset=utf-8'}, data] as const),
    mapProc(source(port.notFound.json), sink(port.terminate), (data) =>
      [404, {'Content-Type': 'application/json; charset=utf-8'}, JSON.stringify(data)] as const),
    mapProc(source(port.notFound.html), sink(port.terminate), (data) =>
      [404, {'Content-Type': 'text/html; charset=utf-8'}, data] as const),
    latestMergeMapProc(source(port.terminate), sink(port.terminated), [source(port.init)],
      ([[statusCode, headers, body], [,res]]) => {
        res.writeHead(statusCode, headers);
        return promisify<string>(res.end).call(res, body)
      }),
    mapProc(source(port.vnode), sink(port.html), (data) =>
      `<!DOCTYPE html>${toHTML(data)}`),
    mapProc(source(port.notFound.vnode), sink(port.notFound.html), (data) =>
      `<!DOCTYPE html>${toHTML(data)}`),
    mergeMapProc(source(port.init), sink(port.body), ([req, res]) =>
      fromEvent<Buffer>(req, 'data').pipe(
        takeUntil(fromEvent(req, 'end')),
        reduce((acc, chunk) =>
          acc.concat(chunk), [] as Buffer[]),
        map((chunks) =>
          Buffer.concat(chunks))))
  )

export const httpServerApiTerminateKit = (port: HttpServerApiPort) =>
  merge(
    mapToProc(source(port.init).pipe(filter(isNotReserved)), sink(port.terminated)),
  )

