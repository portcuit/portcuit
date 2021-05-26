import {of, zip} from "rxjs";
import {filter, take} from "rxjs/operators";
import {
  directProc,
  ForcePublicPort,
  IFlow,
  mapToProc,
  mergeParamsPrototypeKit,
  sink,
  Socket,
  source
} from "@pkit/core";
import {startStep, StatePort} from '@pkit/state'
import {HttpServerContext, HttpServerRestPort} from "@pkit/http/server";
import {SnabbdomServerPort} from "@pkit/snabbdom/server";
import {SpaState} from "../../../shared/";

type ISpaServerSsrLogicPort = ForcePublicPort<{
  init: Socket<{
    ctx: HttpServerContext,
    state: SpaState
  }>;
  state: Omit<StatePort<SpaState>, 'circuit'>;
  html: Socket<string>;
  rest: HttpServerRestPort;
  vdom: SnabbdomServerPort;
  terminated: Socket<any>;
}>
type Kit = IFlow<ISpaServerSsrLogicPort>

const initStateRestGetKit: Kit = (port, {state, ctx: [{method}]}) =>
  mapToProc(zip(of(method === 'GET').pipe(filter(Boolean)),
    source(port.rest.ready), source(port.vdom.ready)).pipe(take(1)),
    sink(port.state.init), state);

const initFlowRestGetKit: Kit = (port, {ctx: [{method}]}) =>
  mapToProc(source(port.state.init).pipe(
    filter(() =>
      method === 'GET')),
    sink(port.state.update),
    [startStep('render')])

const respondHtmlKit: Kit = (port) =>
  directProc(source(port.html), sink(port.rest.response.html))

export namespace ISpaServerSsrLogicPort {
  export const prototype = {
    initStateRestGetKit,
    initFlowRestGetKit,
    respondHtmlKit
  };
  export const circuit = (port: ISpaServerSsrLogicPort) =>
    mergeParamsPrototypeKit(port, prototype)
}
