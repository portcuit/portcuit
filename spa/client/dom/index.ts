import {fromEvent} from 'rxjs'
import {filter, map} from 'rxjs/operators'
import {Container, directProc, mapProc, Port, PortParams, sink, Socket, SocketData} from "@pkit/core";
import {UpdateBatch} from '@pkit/state'
import {domEventMap} from './lib'

export class SpaClientDomPort<T = any> extends Port {
  init = new Socket<{
    doc: Document
  }>();
  event = new class extends Container {
    click = new Socket<Omit<MouseEvent, 'target'> & {target: HTMLElement & {dataset: {bind: string}}} & {batch: UpdateBatch<T>}>()
    change = new Socket<Omit<Event, 'target'> & {target: HTMLElement & {dataset: {bind: string}, value: string, checked: boolean}} & {batch: UpdateBatch<T>}>()
  }

  startClickDomEventFlow = (port: this, {doc}: PortParams<this>) =>
    directProc(fromEvent<SocketData<SpaClientDomPort['event']['click']>>(doc, 'click').pipe(
      map(domEventMap),
      filter(({batch}) => !!batch)),
      sink(port.event.click))

  startChangeDomEventFlow = (port: this, {doc}: PortParams<this>) =>
    directProc(fromEvent<SocketData<SpaClientDomPort['event']['change']>>(doc, 'change').pipe(
      map(domEventMap),
      filter(({batch}) => !!batch)),
      sink(port.event.change))
}
