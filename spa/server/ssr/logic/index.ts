import {
  directProc,
  ForcePublicPort,
  IKit,
  mapProc,
  mergeParamsPrototypeKit,
  sink,
  Socket,
  source, tuple
} from "../../../../core/";
import {HttpServerContext, HttpServerRestPort} from "../../../../http/server/";
import {SnabbdomServerPort} from "../../../../snabbdom/server";
import {of, zip} from "rxjs";
import {filter, take} from "rxjs/operators";
import {SpaState} from "../../../shared/state";
import {startFlow, StatePort} from "../../../../core/state/index";

type ISpaSsrPort = ForcePublicPort<{
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
type Kit = IKit<ISpaSsrPort>

const initStateRestGetKit: Kit = (port, {state, ctx: [{method}]}) =>
  mapProc(zip(of(method === 'GET').pipe(filter(Boolean)),
    source(port.rest.ready), source(port.vdom.ready)).pipe(take(1)),
    sink(port.state.init),
    () => tuple(state, [startFlow('render')]))

const respondHtmlKit: Kit = (port) =>
  directProc(source(port.html), sink(port.rest.response.html))

export namespace ISpaSsrPort {
  export const prototype = {
    initStateRestGetKit,
    respondHtmlKit
  };
  export const circuit = (port: ISpaSsrPort) =>
    mergeParamsPrototypeKit(port, prototype)
}
