import {LifecyclePort, Socket} from "@pkit/core";
import {SpaClientDomLogicPort} from "./mixin/logic";

export class SpaClientDomPort extends LifecyclePort {
  init = new Socket<{
    doc: Document
  }>();

  event = {
    click: new Socket<Omit<MouseEvent, 'target'> & {target: HTMLElement & {dataset: {bind: string}}}>(),
    change: new Socket<Omit<Event, 'target'> & {target: HTMLElement & {dataset: {bind: string}, value: string, checked: boolean}}>()
  }

  circuit() {
    const port = this;
    return SpaClientDomLogicPort.circuit(port)
  }
}
Object.assign(SpaClientDomPort.prototype, SpaClientDomLogicPort.prototype)