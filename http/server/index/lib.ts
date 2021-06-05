import {promisify} from 'util'
import minimatch from 'minimatch'
import {pick} from 'ramda'
import {IncomingMessage, ServerResponse} from 'http'
import {Observable, from} from 'rxjs'
import {mergeMap, map, tap, filter, delay} from 'rxjs/operators'
import {Sink, Socket, source} from '@pkit/core'

export const route = (ptn: Partial<RoutePattern>, ctx$: Observable<HttpServerContext>) =>
  ctx$.pipe(
    filter(isNotReserved),
    filter(isMatchPattern(normalizePattern(ptn))),
    tap(reserveResponse())
  );

export const sourceRoute = (sock: Socket<HttpServerContext>, ptn: Route) =>
  source(sock).pipe(
    filter(isNotReserved),
    filter(isMatchPattern(normalizePattern(ptn))),
    tap(reserveResponse())
  );

export const get = (path: string, ctx$: Observable<HttpServerContext>) =>
  route(normalizePattern({path}), ctx$);

export const post = (path: string, ctx$: Observable<HttpServerContext>) =>
  route(normalizePattern({path}), ctx$);

export type HttpServerContext = [IncomingMessage, ServerResponse]

export const originFromRequest = (req: IncomingMessage) => {
  const proto = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${req.headers.origin || proto + '://' + host}/${req.url}`;
}

export const reserveResponse = (id = (new Date).getTime().toString()) =>
  ([,res]: HttpServerContext) =>
    res.setHeader('X-Request-Id', id);

export const isNotReserved = ([,res]: HttpServerContext) =>
  !res.hasHeader('X-Request-Id')

export type HttpMethod = 'GET' | 'POST'

export type RoutePattern = {
  path: string,
  method: HttpMethod[],
  domain: string,
  matcher?: (url: URL, req: IncomingMessage, ptn: RoutePattern) => boolean
}

export type Route = Partial<RoutePattern>

const normalizePattern = (ptn: Partial<RoutePattern>): RoutePattern =>
  ({
    path: '**',
    method: ['GET', 'POST'],
    domain: '*',
    ...ptn
  })

const isMatchPattern = (ptn: RoutePattern): (ctx: HttpServerContext) => boolean =>
  ([req]) => {
    const url = new URL(originFromRequest(req));
    if (ptn.matcher) {
      return ptn.matcher(url, req, ptn);
    } else {
      const {path, method, domain} = ptn;
      const {pathname, hostname} = url;
      return minimatch(pathname, path) &&
        minimatch(hostname, domain) &&
        method.includes(req.method as HttpMethod);
    }
  }

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
