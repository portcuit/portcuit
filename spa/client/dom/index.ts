import {fromEvent, merge} from 'rxjs'
import {filter, map, mergeMap} from 'rxjs/operators'
import {Container, DeepPartialPort, ofProc, Port, PortParams, sink, Socket} from "@pkit/core";
import {UpdateBatch} from '@pkit/state'

export * from './lib'

export class SpaClientDomPort<T = any> extends Port {
  init = new Socket<{
    doc: Document
  }>();
  event = new class extends Container {
    click = new Socket<MouseEvent & {target: HTMLElement} & {batch: UpdateBatch<T>}>()
    change = new Socket<Event & {target: HTMLInputElement} & {batch: UpdateBatch<T>}>()
    focus = new Socket<FocusEvent & {batch: UpdateBatch<T>}>()
    blur = new Socket<FocusEvent & {batch: UpdateBatch<T>}>()
  }

  constructor (port: DeepPartialPort<SpaClientDomPort<T>> = {}) {
    super(port)
  }

  fromEventFlow = (port: this, {doc}: PortParams<this>) =>
    merge(...Container.entries(port.event).map(([name, sock]) =>
      fromEvent(doc, name).pipe(
        map((ev) => {
          const prop = `on${name.slice(0, 1).toUpperCase()}${name.slice(1)}`
          const extractBatch = (elm: HTMLElement): UpdateBatch<T> | null => {
            if (elm && elm.dataset && elm.dataset?.[prop]) {
              return JSON.parse(elm.dataset?.[prop]!)
            } else if (elm.parentNode) {
              return extractBatch(elm.parentNode as HTMLElement)
            } else {
              return null
            }
          }
          const batch = ev.target && extractBatch(ev.target as HTMLElement)
          return Object.defineProperty(ev, 'batch', {
            value: batch,
            enumerable: true
          })
        }),
        filter(({batch}) => !!batch),
        map((ev) =>
          sink(sock as any)(ev)))))
}
