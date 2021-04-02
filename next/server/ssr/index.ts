import handler from "serve-handler";
import {merge, Observable, zip} from "rxjs";
import {delay, filter, switchMap, withLatestFrom} from "rxjs/operators";
import {
  LifecyclePort,
  sink,
  source,
  Socket,
  PortMessage,
  Sink,
  directProc,
  mapProc,
  mapToProc,
  mergeMapProc,
  StatePort,
  encodePatch,
  decodePatch,
  PortParams,
  PatchPort
} from '@pkit/core'
import {HttpServerContext, HttpServerRestPort, makeHtmlResponse, route} from "@pkit/http/server";
import {SnabbdomServerPort} from "@pkit/snabbdom/server";
import {NextState} from "../../";
import {VNode} from "snabbdom/jsx-global";
import {shouldSsrMethodPost} from "../../shared";

export abstract class NextStatePort<T> extends LifecyclePort {
  init = new Socket<{
    state: T
  }>();
  state: Omit<StatePort<T>, 'constructor'> = new StatePort<T>();

  circuit() {
    const port = this;
    return merge(
      super.circuit(),
      port.state.circuit(),
      mapProc(source(port.init).pipe(delay(0)),
        sink(port.state.init), ({state}) => state),
      mapToProc(source(port.init), sink(port.ready))
    )
  }
}

export class NextRestPort<T> extends NextStatePort<T> {
  init = new Socket<{
    ctx: HttpServerContext;
    rest?: {
      preventTerminate?: boolean
    }
  } & PortParams<NextStatePort<T>>>();
  rest = new HttpServerRestPort;

  circuit() {
    const port = this;
    return merge(
      super.circuit(),
      port.rest.circuit(),
      mapProc(source(port.init), sink(port.rest.init), ({ctx}) => ctx),
      mapToProc(source(port.init).pipe(
        switchMap(({rest}) =>
          source(port.rest.terminated).pipe(
            filter(() =>
              !rest?.preventTerminate)))),
        sink(port.terminated))
    )
  }
}


export interface INextApiPort<T> {
  init: Socket<PortParams<NextRestPort<T>>>;
  state: StatePort<T>;
  rest: HttpServerRestPort;
  patch: Omit<PatchPort<T>, 'constructor'>;
}

export namespace INextApiPort {
  export const circuit = <T>(port: INextApiPort<T>) =>
    merge(
      mapProc(zip(source(port.rest.request.body.json), source(port.state.init)),
        sink(port.patch.decode),
        ([patch]) => patch),

      mapProc(source(port.patch.encode).pipe(
        withLatestFrom(source<NextState>(port.state.data as any)),
        filter(([,state]) =>
          shouldSsrMethodPost(state))),
        sink(port.rest.response.json), ([patch]) => encodePatch(patch)),

      mapProc(source(port.patch.decode), sink(port.state.update), decodePatch)
    )
}

export class NextApiPort<T> extends NextRestPort<T> implements INextApiPort<T> {
  init = new Socket<PortParams<INextApiPort<T>>>();
  patch: Omit<PatchPort<T>, 'constructor'> = new PatchPort<T>();

  circuit () {
    return merge(
      super.circuit(),
      INextApiPort.circuit<T>(this)
    )
  }
}

export interface INextRenderPort<T> extends Omit<LifecyclePort, 'circuit'> {
  state: StatePort<T>;
  vdom: SnabbdomServerPort;
}

export namespace INextRenderPort {
  export const circuit = <T extends NextState>(port: INextRenderPort<T>) =>
    merge(
      port.vdom.circuit(),
      mapToProc(source(port.init), sink(port.vdom.init)),
    )
}

export abstract class NextSsrPort<T extends NextState> extends NextRestPort<T> implements INextRenderPort<T> {
  vdom = new SnabbdomServerPort();

  abstract renderKit (port: Pick<this, 'state' | 'vdom'>): Observable<PortMessage<VNode>>

  circuit() {
    const port = this;
    return merge(
      super.circuit(),
      INextRenderPort.circuit(port),
      directProc(source(port.vdom.html), sink(port.rest.response.html)),
      this.renderKit(port)
    )
  }
}

export abstract class NextSsrApiPort<T extends NextState> extends NextSsrPort<T> implements INextApiPort<T> {
  patch: Omit<PatchPort<T>, 'constructor'> = new PatchPort<T>();

  circuit (): Observable<PortMessage<any>> {
    return merge(
      super.circuit(),
      INextApiPort.circuit<T>(this)
    )
  }
}

export const notFoundProc = (source$: Observable<HttpServerContext>, debugSink: Sink<any>, prefix='/404/') =>
  mergeMapProc(route({path: '**'}, source$), debugSink, (ctx) =>
    (new class extends HttpServerRestPort {
      circuit () {
        const rest = this;
        return merge(
          super.circuit(),
          mapToProc(source(rest.init), sink(rest.response.raw),
            makeHtmlResponse('Not Found', {status: 404}))
        )
      }
    }).stream(ctx))

export const staticProc = (source$: Observable<HttpServerContext>, sink: Sink<any>, doc: {root: string, prefix?: string}) =>
  mergeMapProc(route({path: '**'}, source$), sink, async ([req, res]) => {
    const appName = req.url!.split('/')[1];
    if (doc.prefix && (!appName || !['src', 'node_modules'].includes(appName))) {
      req.url = doc.prefix + req.url
    }
    return ({handler: await handler(req, res, {public: doc.root, cleanUrls: false, symlinks: true})})
  })
