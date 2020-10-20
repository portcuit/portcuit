import {promisify} from 'util'
import {resolve} from 'path'
import glob from 'glob'
import handler from "serve-handler";
import {from, merge, Observable} from "rxjs";
import {delay, map, switchMap} from "rxjs/operators";
import {
  sink,
  source,
  mergeMapProc,
  entry,
  terminatedComplete,
  mapToProc,
  mount,
  LifecyclePort,
  mapProc,
  PortMessage, Sink, EphemeralString
} from "pkit";
import {HttpServerPort, route, HttpServerParams, Route} from "pkit/http/server";
import {CreateSsr} from "./ssr/";
import {NextSsrPort} from "@pkit/next/server/index";
import {IState} from "@pkit/next";
import {HttpServerContext} from "pkit/http/server/index";
import {FC} from "@pkit/snabbdom";

export * from './ssr/'

interface ISsrPort<T> {
  new (...args: any[]): {
    entry: <U extends NextSsrPort.Params<T>>(params: U) => Observable<PortMessage<any>>
  }
}

export const createCreatePortProc = <T extends IState>(Port: ISsrPort<T>) =>
  (Html: FC<T>, state: T, matchRoute: Route) =>
    (source$: Observable<HttpServerContext>, sink: Sink<any>) =>
      mergeMapProc(route(matchRoute.path, source$, matchRoute.method), sink, (ctx) =>
        new Port().entry({
          Html, ctx,
          state: {...state,
            flag: {method: new EphemeralString(ctx[0].method!)}
          }
        }))

export type NextHttpParams = {
  server: HttpServerParams;
  pages: string;
}

export class NextHttpPort extends LifecyclePort<NextHttpParams> {
  server = new HttpServerPort;
}

export const nextHttpKit = (port: NextHttpPort) =>
  merge(
    HttpServerPort.prototype.circuit(port.server),

    source(port.init).pipe(
      switchMap(({pages}) =>
        from(promisify(glob)(`${pages}/**/[!_]*.tsx`)).pipe(
          map((files) =>
            files
              .map((file) =>
                require(resolve(file.slice(0,-4))))
              .filter((page) =>
                !!page.createSsr && typeof page.createSsr === 'function')),
          switchMap((pages) =>
            mergeMapProc(source(port.server.event.request), sink(port.debug), (requestArgs) =>
              merge(...pages.map(({createSsr}: {createSsr: CreateSsr<any>}) =>
                terminatedComplete(mount(createSsr(requestArgs)))))))))),
    mergeMapProc(route('**', source(port.server.event.request).pipe(delay(0))), sink(port.server.debug), async ([req, res]) => {
      const appName = req.url!.split('/')[1];
      if (!appName || !['src', 'node_modules'].includes(appName)) {
        req.url = '/public' + req.url
      }
      return ({handler: await handler(req, res, {public: '.', cleanUrls: false})})
    }),
    mapToProc(source(port.server.ready), sink(port.server.running), true),
    mapProc(source(port.init), sink(port.server.init), ({server}) => server),
  )

export default {Port: NextHttpPort, circuit: nextHttpKit}