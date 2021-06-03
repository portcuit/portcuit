import {Port, Socket} from "@pkit/core";
import {ISpaClientDomLogicPort} from "./mixins/logic";

export class SpaClientDomPort extends Port {
  init = new Socket<{
    doc: Document
  }>();
  event = {
    click: new Socket<Omit<MouseEvent, 'target'> & {target: HTMLElement & {dataset: {bind: string}}}>(),
    change: new Socket<Omit<Event, 'target'> & {target: HTMLElement & {dataset: {bind: string}, value: string, checked: boolean}}>()
  }

  flow() {
    return ISpaClientDomLogicPort.flow(this)
  }
}
