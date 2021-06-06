import {fromEvent} from 'rxjs'
import {filter} from 'rxjs/operators'
import {Container, directProc, Port, PortParams, sink, Socket, SocketData} from "@pkit/core";

export class SpaClientDomPort extends Port {
  init = new Socket<{
    doc: Document
  }>();
  event = new class extends Container {
    click = new Socket<Omit<MouseEvent, 'target'> & {target: HTMLElement & {dataset: {bind: string}}}>()
    change = new Socket<Omit<Event, 'target'> & {target: HTMLElement & {dataset: {bind: string}, value: string, checked: boolean}}>()
  }

  startClickDomEventFlow = (port: this, {doc}: PortParams<this>) =>
    directProc(fromEvent<SocketData<SpaClientDomPort['event']['click']>>(doc, 'click').pipe(
      filter(({target}) =>
        !!target && !!target.dataset.bind)),
      sink(port.event.click));

  startChangeDomEventFlow = (port: this, {doc}: PortParams<this>) =>
    directProc(fromEvent<SocketData<SpaClientDomPort['event']['change']>>(doc, 'change').pipe(
      filter(({target}) =>
        !!target && !!target.dataset.bind)),
      sink(port.event.change));
}
