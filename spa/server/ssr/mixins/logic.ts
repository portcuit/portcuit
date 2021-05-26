import {filter} from "rxjs/operators";
import {
  cycleFlow,
  directProc,
  IFlow, IPort,
  mapToProc,
  replaceProperty,
  sink,
  source
} from "@pkit/core";
import {startStep} from '@pkit/state'
import {SpaState} from "@pkit/spa";
import {SpaServerSsrPort} from "../";

type ISpaServerSsrLogicPort = IPort<SpaServerSsrPort<SpaState>>
type Flow = IFlow<ISpaServerSsrLogicPort>

const startRenderFlow: Flow = (port, {ctx: [{method}]}) =>
  mapToProc(source(port.state.init).pipe(
    filter(() =>
      method === 'GET')),
    sink(port.state.update),
    [startStep('render')])

const respondHtmlFlow: Flow = (port) =>
  directProc(source(port.html), sink(port.rest.response.html))

export namespace ISpaServerSsrLogicPort {
  export const prototype = {
    startRenderFlow,
    respondHtmlFlow
  };
  export const circuit = (port: ISpaServerSsrLogicPort & typeof prototype) =>
    cycleFlow(port, 'init', 'terminated', replaceProperty(port, prototype))
}
