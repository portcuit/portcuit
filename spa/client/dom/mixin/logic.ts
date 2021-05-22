import {fromEvent} from "rxjs";
import {filter} from "rxjs/operators";
import {directProc, ForcePublicPort, IKit, mergeParamsPrototypeKit, sink} from "@pkit/core";
import {SpaClientDomPort} from "../";

type SpaClientDomLogicPort = ForcePublicPort<SpaClientDomPort>
type Kit = IKit<SpaClientDomLogicPort>

const delegateEventClickKit: Kit = (port, {doc}) =>
  directProc(fromEvent<MouseEvent & {target: HTMLElement}>(doc, 'click').pipe(
    filter(({target}) =>
      !!target && !!target.dataset.bind)),
    sink(port.event.click));

const delegateEventChangeKit: Kit = (port, {doc}) =>
  directProc(fromEvent<Event & {target: HTMLElement}>(doc, 'change').pipe(
    filter(({target}) =>
      !!target && !!target.dataset.bind)),
    sink(port.event.change));

export namespace SpaClientDomLogicPort {
  export const prototype = {
    delegateEventClickKit,
    delegateEventChangeKit
  }
  export const circuit = (port: SpaClientDomLogicPort) =>
    mergeParamsPrototypeKit(port, prototype)
}
