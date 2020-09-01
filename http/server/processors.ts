import {promisify} from 'util'
import minimatch from 'minimatch'
import {pick} from 'ramda'
import {IncomingMessage, ServerResponse} from 'http'
import {Observable, from, of, fromEvent, merge} from 'rxjs'
import {mergeMap, map, catchError, takeUntil, toArray, tap, filter} from 'rxjs/operators'
import {Sink} from 'pkit/core'

export type RequestArgs = [IncomingMessage, ServerResponse]

export const reserveResponse = (id = (new Date).getTime().toString()) =>
  ([,res]: RequestArgs) =>
    res.setHeader('X-Request-Id', id);

export const isNotReserved = ([,res]: RequestArgs) =>
  !res.hasHeader('X-Request-Id')

export const isMatchEndpoint = (pattern: string, targetMethod?: string) =>
  ([{url, headers:{origin}, method}]: RequestArgs) =>
    minimatch((new URL(`${origin || 'file://'}${url}`)).pathname, pattern) &&
    (targetMethod ? method === targetMethod : true)

export const get = (pattern: string, source$: Observable<RequestArgs>) =>
  route(pattern, source$, 'GET')

export const post = (pattern: string, source$: Observable<RequestArgs>) =>
  route(pattern, source$, 'POST')

export const route = (pattern: string, source$: Observable<RequestArgs>, method?: string) =>
  source$.pipe(filter(isNotReserved), filter(isMatchEndpoint(pattern, method)), tap(reserveResponse()))


export type RouteReq = [{method?: string, url: URL}, RequestArgs]
export const routeProc = (source$: Observable<RequestArgs>, sink: Sink<RequestArgs>, fn: (data: RouteReq) => boolean) =>
  source$.pipe(
    filter(([,res]) =>
      !res.hasHeader('X-Request-Id')),
    filter(([req, res]) => {
      const {method, url, headers:{origin}} = req;
      return fn([{method, url: new URL(`${origin || 'file://'}${url}`)}, [req, res]])
    }),
    tap(([,res]) =>
      res.setHeader('X-Request-Id', (new Date).getTime().toString())),
    tap(([,res]) =>
      res.setHeader('Access-Control-Allow-Origin', '*')),
    map((data) =>
      sink(data)));

export const preflightProc = (source$: Observable<RequestArgs>, sink: Sink<any>) =>
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

export const notFoundProc = (source$: Observable<RequestArgs>, sink: Sink<any>) =>
  source$.pipe(
    filter(([,res]) =>
      !res.hasHeader('X-Request-Id')),
    tap(([,res]) =>
      res.writeHead(404, {
        'Access-Control-Allow-Origin': '*',
        'X-Request-Id': (new Date).getTime().toString()
      })),
    mergeMap(([req,res]) =>
      from(promisify(res.end).bind(res)()).pipe(
        map(() =>
          sink({name: 'notFound',
            ...pick(['url', 'method'], req)})))));

export const remoteReceiveProc = (source$: Observable<RequestArgs>, sink: Sink<void>, errSink: Sink<Error>) =>
  source$.pipe(
    mergeMap(([req, res]) =>
      fromEvent<Buffer>(req, 'data').pipe(
        takeUntil(fromEvent(req, 'end')),
        toArray(),
        mergeMap((chunks: Buffer[]) =>
          merge(
            of(JSON.parse(Buffer.concat(chunks).toString())),
            of([200, JSON.stringify({error: false})] as const).pipe(
              tap(([statusCode]) =>
                res.writeHead(statusCode, {'Content-Type': 'application/json; charset=utf-8'})),
              mergeMap(([, payload]) =>
                promisify<string>(res.end).call(res, payload)),
              map(() =>
                sink())))),
        catchError(err =>
          merge(
            of(errSink(err)),
            ...err instanceof SyntaxError ? [
              of([400, JSON.stringify({error: true, message: err.message})] as const).pipe(
                tap(([statusCode]) =>
                  res.writeHead(statusCode, {'Content-Type': 'application/json; charset=utf-8'})),
                mergeMap(([, payload]) =>
                  promisify<string>(res.end).call(res, payload)),
                map(() =>
                  sink()))] : [])))));

export const promiseJsonProc = <T, U>(source$: Observable<RequestArgs>, sink: Sink<void>, fn: (data: T) => Promise<U>) =>
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
