import {fromEvent} from "rxjs";
import {filter} from "rxjs/operators";
import {
  cycleFlow,
  directProc,
  IFlow, IPort,
  replaceProperty,
  sink
} from "@pkit/core";
import {SpaClientDomPort} from "../";

type ISpaClientDomLogicPort = IPort<SpaClientDomPort>
type Flow = IFlow<ISpaClientDomLogicPort>

const startClickDomEventFlow: Flow = (port, {doc}) =>
  directProc(fromEvent<MouseEvent & {target: HTMLElement}>(doc, 'click').pipe(
    filter(({target}) =>
      !!target && !!target.dataset.bind)),
    sink(port.event.click));

const startChangeDomEventFlow: Flow = (port, {doc}) =>
  directProc(fromEvent<Event & {target: HTMLElement}>(doc, 'change').pipe(
    filter(({target}) =>
      !!target && !!target.dataset.bind)),
    sink(port.event.change));

export namespace ISpaClientDomLogicPort {
  export const prototype = {
    startClickDomEventFlow,
    startChangeDomEventFlow
  }
  export const flow = (port: ISpaClientDomLogicPort) =>
    cycleFlow(port, 'init', 'terminated', prototype)
}
