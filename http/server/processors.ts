import {promisify} from 'util'
import minimatch from 'minimatch'
import {pick} from 'ramda'
import {IncomingMessage, ServerResponse} from 'http'
import {Observable, from, of, fromEvent, merge} from 'rxjs'
import {mergeMap, map, catchError, takeUntil, toArray, tap, filter, delay} from 'rxjs/operators'
import {Sink} from 'pkit/core'

export type HttpServerContext = [IncomingMessage, ServerResponse]

export const reqToUrl = ({url, headers:{origin}, method}: IncomingMessage) =>
  new URL(`${origin || 'file://'}${url}`)

export const reserveResponse = (id = (new Date).getTime().toString()) =>
  ([,res]: HttpServerContext) =>
    res.setHeader('X-Request-Id', id);

export const isNotReserved = ([,res]: HttpServerContext) =>
  !res.hasHeader('X-Request-Id')

export const isMatchEndpoint = (pattern: string, targetMethod?: HttpMethod[]) =>
  ([req]: HttpServerContext) =>
    minimatch(reqToUrl(req).pathname, pattern) &&
    (targetMethod ? targetMethod.includes(req.method as HttpMethod) : true)

type HttpMethod = 'GET' | 'POST'

export type Route = {path: string, method: HttpMethod[]}

export const get = (pattern: string, source$: Observable<HttpServerContext>) =>
  route(pattern, source$, ['GET'])

export const post = (pattern: string, source$: Observable<HttpServerContext>) =>
  route(pattern, source$, ['POST'])

export const route = (pattern: string, source$: Observable<HttpServerContext>, method?: HttpMethod[]) =>
  source$.pipe(filter(isNotReserved), filter(isMatchEndpoint(pattern, method)), tap(reserveResponse()), delay(0))


export type RouteReq = [{method?: string, url: URL}, HttpServerContext]
export const routeProc = (source$: Observable<HttpServerContext>, sink: Sink<HttpServerContext>, fn: (data: RouteReq) => boolean) =>
  source$.pipe(
    filter(([,res]) =>
      !res.hasHeader('X-Request-Id')),
    filter(([req, res]) => {
      const {method, url, headers:{origin}} = req;
      return fn([{method, url: reqToUrl(req)}, [req, res]])
    }),
    tap(([,res]) =>
      res.setHeader('X-Request-Id', (new Date).getTime().toString())),
    tap(([,res]) =>
      res.setHeader('Access-Control-Allow-Origin', '*')),
    map((data) =>
      sink(data)));

export const preflightProc = (source$: Observable<HttpServerContext>, sink: Sink<any>) =>
  source$.pipe(
    filter(([,res]) =>
      !res.hasHeader('X-Request-Id')),
    filter(([{method}]) =>
      method === 'OPTIONS'),
    tap(([,res]) =>
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
        'Access-Control-Allow-Headers': 'Origin, Authorization, Accept, Content-Type',
        'Access-Control-Max-Age': '3600',
        'X-Request-Id': (new Date).getTime().toString()
      })),
    mergeMap(([req, res]) =>
      from(promisify(res.end).bind(res)()).pipe(
        map(() =>
          sink({name: 'preflight',
            ...pick(['url'], req)})))));

export const promiseJsonProc = <T, U>(source$: Observable<HttpServerContext>, sink: Sink<void>, fn: (data: T) => Promise<U>) =>
  source$.pipe(
    mergeMap(([req, res]) =>
      fromEvent<Buffer>(req, 'data').pipe(
        takeUntil(fromEvent(req, 'end')),
        toArray(),
        map((chunks: Buffer[]) =>
          Buffer.concat(chunks).toString()),
        mergeMap((body) =>
          fn(JSON.parse(body))),
        map((data) =>
          [200, JSON.stringify(data)] as const),
        catchError((err) =>
          of([400, JSON.stringify({error:{message: err.message}})] as const)),
        tap(([statusCode]) =>
          res.writeHead(statusCode, {'Content-Type': 'application/json; charset=utf-8'})),
        mergeMap(([, payload]) =>
          promisify<string>(res.end).call(res, payload)),
        map(() =>
          sink()))));
