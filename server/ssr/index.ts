import {merge} from "rxjs";
import {promisify} from "util";
import {writeFile} from "fs";
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
  latestMergeMapProc, Patch, Socket, EncodedPatch, encodePatch, decodePatch, latestMapProc, DeepPartial
} from 'pkit'
import {HttpServerContext} from "pkit/http/server";
import {FC} from "@pkit/snabbdom";
import {httpServerRestKit, HttpServerRestPort} from "pkit/http/server/index";
import {snabbdomSsrKit, SnabbdomSsrPort} from "@pkit/snabbdom/ssr";
import {IState} from "../..";
import {delay, filter} from "rxjs/operators";

class RendererPort<T> extends LifecyclePort<FC<T>> {}

type NextStateParams<T> = {
  state: T
}

class NextStatePort<T, U extends NextStateParams<T>> extends LifecyclePort<U> {
  state = new StatePort<T>();
}

const nextStateKit = <T, U extends NextStateParams<T>>(port: NextStatePort<T, U>) =>
  merge(
    stateKit(port.state),
    mapProc(source(port.init).pipe(delay(0)),
      sink(port.state.init), ({state}) => state),
    mapToProc(source(port.init), sink(port.ready))
  )

export type NextRestParams<T> = {
  ctx: HttpServerContext;
} & NextStateParams<T>

export class NextRestPort<T, U extends NextRestParams<T>> extends NextStatePort<T, U> {
  rest = new HttpServerRestPort;
}

export const nextRestKit = <T, U extends NextRestParams<T>>(port: NextRestPort<T, U>) =>
  merge(
    httpServerRestKit(port.rest),
    nextStateKit(port),
    mapProc(source(port.init), sink(port.rest.init), ({ctx}) => ctx),
    mapToProc(source(port.rest.terminated), sink(port.terminated)),
  )

export class NextApiPort<T, U extends NextRestParams<T> = NextRestParams<T>> extends NextRestPort<T, U> {
  patch = new class {
    encode = new Socket<Patch<T>>();
    decode = new Socket<EncodedPatch>();
  }
}

export const nextApiKit = <T, U extends NextRestParams<T>>(port: NextApiPort<T, U>) =>
  merge(
    nextRestKit(port),
    mapProc(source(port.patch.encode), sink(port.rest.response.json), encodePatch),
    mapProc(source(port.patch.decode), sink(port.state.patch), decodePatch),
  )

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

type NextSsrParams<T> = NextRenderParams<T> & NextRestParams<T>;

export class NextSsrPort<T, U extends NextSsrParams<T> = NextSsrParams<T>> extends NextRestPort<T, U> {
  vdom = new SnabbdomSsrPort;
}

export const nextSsrKit = <T extends IState>(port: NextSsrPort<T>) =>
  merge(
    nextRestKit(port),
    nextRenderKit(port),
    directProc(source(port.vdom.html), sink(port.rest.response.html)),
  )

export type CreateSsr<T> = (ctx: HttpServerContext) => Portcuit<NextSsrPort<T>>

export type NextSsgInfo = [fileName: string, input: string, output: string];

type NextSsgParams<T> = {
  info: NextSsgInfo,
} & NextRenderParams<T> & NextStateParams<T>

export class NextSsgPort<T, U extends NextSsgParams<T> = NextSsgParams<T>> extends NextStatePort<T, U> {
  vdom = new SnabbdomSsrPort;
}

export const nextSsgKit = <T extends IState>(port: NextSsgPort<T>) =>
  merge(
    nextStateKit(port),
    nextRenderKit(port),
  )

export type CreateSsg<T> = (...ssgInfo: NextSsgInfo) => Portcuit<NextSsgPort<T>>

export const ssgPublishKit = <T>(port: NextSsgPort<T>) =>
  latestMergeMapProc(source(port.vdom.html), sink(port.terminated),
    [source(port.init)], async ([html,{info: [fileName, input, output]}]) => {
      const path = `${output}${fileName.substr(input.length).replace(/\/ui/, '')}.html`;
      return {writeFile: await promisify(writeFile)(path, html), path}
    })