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
import {filter} from "rxjs/operators";

class RendererPort<T> extends LifecyclePort<FC<T>> {}

export type NextRestParams<T> = {
  ctx: HttpServerContext;
  state: T;
}

type InferState<T> = T extends {state: infer I} ? I : never;

export class NextRestPort<T> extends LifecyclePort<T> {
  rest = new HttpServerRestPort;
  state = new StatePort<InferState<T>>();
}

export const nextRestKit = <T>(port: NextRestPort<T>) =>
  merge(
    httpServerRestKit(port.rest),
    stateKit(port.state),
    mapToProc(source(port.rest.terminated), sink(port.terminated)),
    mapToProc(source(port.init), sink(port.ready))
  )

export class NextApiPort<T> extends NextRestPort<NextRestParams<T>> {
  patch = new class {
    encode = new Socket<Patch<T>>();
    decode = new Socket<EncodedPatch>();
  }
}

export const nextApiKit = <T>(port: NextApiPort<T>) =>
  merge(
    nextRestKit(port),
    mapProc(source(port.init), sink(port.rest.init), ({ctx}) => ctx),
    mapProc(source(port.init), sink(port.state.init), ({state}) => state),
    mapProc(source(port.patch.encode), sink(port.rest.response.json), encodePatch),
    mapProc(source(port.patch.decode), sink(port.state.patch), decodePatch),
  )

type NextSsrParams<T> = {
  Html: FC<T>;
} & NextRestParams<T>

export class NextSsrPort<T> extends NextRestPort<NextSsrParams<T>> {
  renderer = new RendererPort<T>();
  vdom = new SnabbdomSsrPort;
}

export const nextSsrKit = <T extends IState>(port: NextSsrPort<T>) =>
  merge(
    httpServerRestKit(port.rest),
    stateKit(port.state),
    snabbdomSsrKit(port.vdom),

    mapProc(source(port.init), sink(port.rest.init), ({ctx}) => ctx),
    mapToProc(source(port.init), sink(port.vdom.init)),
    mapProc(source(port.init), sink(port.renderer.init), ({Html}) => Html),

    latestMapProc(source(port.state.data).pipe(
      filter(({flag}) =>
        !!flag?.render)),
      sink(port.vdom.render), [source(port.init)],
      ([state,{Html}]) =>
        Html(state)),

    mapProc(source(port.init), sink(port.state.init), ({state}) => state as DeepPartial<T>),

    directProc(source(port.vdom.html), sink(port.rest.response.html)),
    mapToProc(source(port.rest.terminated), sink(port.terminated)),
    mapToProc(source(port.init), sink(port.ready))
  )

export type CreateSsr<T> = (ctx: HttpServerContext) => Portcuit<NextSsrPort<T>>

export type SsgInfo = [fileName: string, input: string, output: string];

type SsgParams<T> = {
  info: SsgInfo,
  Html: FC<T>
}

export class SharedSsgPort<T> extends LifecyclePort<SsgParams<T>> {
  state = new StatePort<T>();
  renderer = new RendererPort<T>();
  vdom = new SnabbdomSsrPort;
}

export const sharedSsgKit = <T>(port: SharedSsgPort<T>) =>
  merge(
    stateKit(port.state),
    snabbdomSsrKit(port.vdom),
    mapToProc(source(port.init), sink(port.vdom.init)),
    mapProc(source(port.init), sink(port.renderer.init), ({Html}) => Html),
  )

export type CreateSsg<T> = (...ssgInfo: SsgInfo) => Portcuit<SharedSsgPort<T>>

export const ssgPublishKit = <T>(port: SharedSsgPort<T>) =>
  latestMergeMapProc(source(port.vdom.html), sink(port.terminated),
    [source(port.init)], async ([html,{info: [fileName, input, output]}]) => {
      const path = `${output}${fileName.substr(input.length).replace(/\/ui/, '')}.html`;
      return {writeFile: await promisify(writeFile)(path, html), path}
    })