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
  StatePort,
  Portcuit,
  latestMergeMapProc, Patch, Socket, EncodedPatch, encodePatch, decodePatch, latestMapProc
} from 'pkit'
import {HttpServerContext, HttpServerRestPort} from "pkit/http/server";
import {FC} from "@pkit/snabbdom";

import {snabbdomSsrKit, SnabbdomSsrPort} from "@pkit/snabbdom/ssr";
import {IState} from "../../";

type NextStateParams<T> = {
  state: T
}

class NextStatePort<T, U extends NextStateParams<T>> extends LifecyclePort<U> {
  state = new StatePort<T>();

  stateKit (port: this) {
    return merge(
      StatePort.prototype.circuit(port.state),
      mapProc(source(port.init).pipe(delay(0)),
        sink(port.state.init), ({state}) => state),
      mapToProc(source(port.init), sink(port.ready))
    )
  }
}

export type NextRestParams<T> = {
  ctx: HttpServerContext;
} & NextStateParams<T>

export class NextRestPort<T, U extends NextRestParams<T>> extends NextStatePort<T, U> {
  rest = new HttpServerRestPort;

  restKit (port: this) {
    return merge(
      HttpServerRestPort.prototype.circuit(port.rest),
      port.stateKit(port),
      mapProc(source(port.init), sink(port.rest.init), ({ctx}) => ctx),
      mapToProc(source(port.rest.terminated), sink(port.terminated)) // これをパラメータ制御
    )
  }
}

export class NextApiPort<T, U extends NextRestParams<T> = NextRestParams<T>> extends NextRestPort<T, U> {
  patch = new class {
    encode = new Socket<Patch<T>>();
    decode = new Socket<EncodedPatch>();
  }

  apiKit (port: this) {
    return merge(
      port.restKit(port),
      mapProc(source(port.patch.encode), sink(port.rest.response.json), encodePatch),
      mapProc(source(port.patch.decode), sink(port.state.update), decodePatch),
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

  nextSsrKit (port: this) {
    return merge(
      port.restKit(port),
      nextRenderKit(port),
      directProc(source(port.vdom.html), sink(port.rest.response.html))
    )
  }

  circuit (port: this) {
    return port.nextSsrKit(port)
  }
}

export namespace NextSsrPort {
  export type Params<T> = NextSsrParams<T>
}

export type CreateSsr<T extends IState> = (ctx: HttpServerContext) => Portcuit<NextSsrPort<T>>

export type NextSsgInfo = [fileName: string, input: string, output: string];

type NextSsgParams<T> = {
  info: NextSsgInfo,
} & NextRenderParams<T> & NextStateParams<T>

export class NextSsgPort<T extends IState, U extends NextSsgParams<T> = NextSsgParams<T>> extends NextStatePort<T, U> {
  vdom = new SnabbdomSsrPort;
  ssgKit (port: this) {
    return merge(
      port.stateKit(port),
      nextRenderKit(port),
    );
  }
}

export type CreateSsg<T extends IState> = (...ssgInfo: NextSsgInfo) => Portcuit<NextSsgPort<T>>

export const ssgPublishKit = <T extends IState>(port: NextSsgPort<T>) =>
  latestMergeMapProc(source(port.vdom.html), sink(port.terminated),
    [source(port.init)], async ([html,{info: [fileName, input, output]}]) => {
      const path = `${output}${fileName.substr(input.length).replace(/\/ui/, '')}.html`;
      return {writeFile: await promisify(writeFile)(path, html), path}
    })