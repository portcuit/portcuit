import {promisify} from "util";
import {writeFile} from "fs";
import {merge} from "rxjs";
import {delay, filter} from "rxjs/operators";
import {
  directProc,
  LifecyclePort,
  mapProc,
  mapToProc,
  sink,
  source,
  stateKit,
  StatePort,
  Portcuit,
  latestMergeMapProc, Patch, Socket, EncodedPatch, encodePatch, decodePatch, latestMapProc
} from 'pkit'
import {HttpServerContext, httpServerRestKit, HttpServerRestPort} from "pkit/http/server";
import {FC} from "@pkit/snabbdom";
import {snabbdomSsrKit, SnabbdomSsrPort} from "@pkit/snabbdom/ssr";
import {IState} from "../../";

type NextStateParams<T> = {
  state: T
}

class NextStatePort<T, U extends NextStateParams<T>> extends LifecyclePort<U> {
  state = new StatePort<T>();

  stateKit () {
    return merge(
      stateKit(this.state),
      mapProc(source(this.init).pipe(delay(0)),
        sink(this.state.init), ({state}) => state),
      mapToProc(source(this.init), sink(this.ready))
    )
  }
}

export type NextRestParams<T> = {
  ctx: HttpServerContext;
} & NextStateParams<T>

export class NextRestPort<T, U extends NextRestParams<T>> extends NextStatePort<T, U> {
  rest = new HttpServerRestPort;

  restKit () {
    return merge(
      httpServerRestKit(this.rest),
      this.stateKit(),
      mapProc(source(this.init), sink(this.rest.init), ({ctx}) => ctx),
      mapToProc(source(this.rest.terminated), sink(this.terminated))
    )
  }
}

export class NextApiPort<T, U extends NextRestParams<T> = NextRestParams<T>> extends NextRestPort<T, U> {
  patch = new class {
    encode = new Socket<Patch<T>>();
    decode = new Socket<EncodedPatch>();
  }

  apiKit () {
    return merge(
      this.restKit(),
      mapProc(source(this.patch.encode), sink(this.rest.response.json), encodePatch),
      mapProc(source(this.patch.decode), sink(this.state.patch), decodePatch),
    )
  }
}

type NextRenderParams<T> = {
  Html: FC<T>;
}

interface NextRenderPort<T, U> {
  init: Socket<U>;
  state: StatePort<T>;
  vdom: SnabbdomSsrPort;
}

const nextRenderKit = <T extends IState, U extends NextRenderParams<T>>(port: NextRenderPort<T, U>) =>
  merge(
    snabbdomSsrKit(port.vdom),
    mapToProc(source(port.init), sink(port.vdom.init)),
    latestMapProc(source(port.state.data).pipe(
      filter(({flag}) =>
        !!flag?.render)),
      sink(port.vdom.render), [source(port.init)],
      ([state,{Html}]) =>
        Html(state))
  )

export type NextSsrParams<T> = NextRenderParams<T> & NextRestParams<T>;

export class NextSsrPort<T extends IState, U extends NextSsrParams<T> = NextSsrParams<T>> extends NextRestPort<T, U> {
  vdom = new SnabbdomSsrPort;

  circuit (params: U) {
    return merge(
      this.restKit(),
      nextRenderKit(this),
      directProc(source(this.vdom.html), sink(this.rest.response.html))
    )
  }
}

export type CreateSsr<T extends IState> = (ctx: HttpServerContext) => Portcuit<NextSsrPort<T>>

export type NextSsgInfo = [fileName: string, input: string, output: string];

type NextSsgParams<T> = {
  info: NextSsgInfo,
} & NextRenderParams<T> & NextStateParams<T>

export class NextSsgPort<T, U extends NextSsgParams<T> = NextSsgParams<T>> extends NextStatePort<T, U> {
  vdom = new SnabbdomSsrPort;
}

export const nextSsgKit = <T extends IState>(port: NextSsgPort<T>) =>
  merge(
    port.stateKit.call(port),
    nextRenderKit(port),
  )

export type CreateSsg<T> = (...ssgInfo: NextSsgInfo) => Portcuit<NextSsgPort<T>>

export const ssgPublishKit = <T>(port: NextSsgPort<T>) =>
  latestMergeMapProc(source(port.vdom.html), sink(port.terminated),
    [source(port.init)], async ([html,{info: [fileName, input, output]}]) => {
      const path = `${output}${fileName.substr(input.length).replace(/\/ui/, '')}.html`;
      return {writeFile: await promisify(writeFile)(path, html), path}
    })