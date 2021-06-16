import {fromEvent} from 'rxjs'
import {filter, map} from 'rxjs/operators'
import {Container, directProc, mapProc, Port, PortParams, sink, Socket, SocketData} from "@pkit/core";
import {UpdateBatch} from '@pkit/state'

export class SpaClientDomPort<T = any> extends Port {
  init = new Socket<{
    doc: Document
  }>();
  event = new class extends Container {
    click = new Socket<Omit<MouseEvent, 'target'> & {target: HTMLElement & {dataset: {bind: string}}} & {detail: UpdateBatch<T>}>()
    change = new Socket<Omit<Event, 'target'> & {target: HTMLElement & {dataset: {bind: string}, value: string, checked: boolean}} & {detail: UpdateBatch<T>}>()
  }

  startClickDomEventFlow = (port: this, {doc}: PortParams<this>) =>
    directProc(fromEvent<SocketData<SpaClientDomPort['event']['click']>>(doc, 'click').pipe(
      filter(({target}) =>
        !!target && !!target.dataset.bind),
      map((ev) =>
        Object.defineProperty(ev, 'detail',
          {enumerable: true, value: JSON.parse(ev.target.dataset.bind)}))),
      sink(port.event.click));

  startChangeDomEventFlow = (port: this, {doc}: PortParams<this>) =>
    directProc(fromEvent<SocketData<SpaClientDomPort['event']['change']>>(doc, 'change').pipe(
      filter(({target}) =>
        !!target && !!target.dataset.bind),
      map((ev) =>
        Object.defineProperty(ev, 'detail',
          {enumerable: true, value: JSON.parse(ev.target.dataset.bind)}))),
      sink(port.event.change));
}
