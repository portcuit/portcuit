import puppeteer, {Browser, Target} from 'puppeteer-core'
import {merge, of} from 'rxjs'
import {filter} from 'rxjs/operators'
import {Container, fromEventProc, latestMergeMapProc, mapToProc, mergeMapProc, Port, PortParams, sink, Socket, source} from "@pkit/core";

export class PuppeteerBrowserPort extends Port {
  init = new Socket<{
    launch?: Readonly<Parameters<typeof puppeteer.launch>>
  }>();
  browser = new Socket<Browser>();
  event = new class extends Container {
    targetcreated = new Socket<Target>();
    disconnected = new Socket<void>();
  }

  launchFlow = (port: this, params: PortParams<this>) =>
    mergeMapProc(of(params).pipe(
      filter(({launch}) => !!launch)),
      sink(port.browser),
      ({launch}) => puppeteer.launch(...launch!))

  readyFlow = (port: this) =>
    mapToProc(source(port.browser), sink(port.ready))

  terminateFlow = (port: this) =>
    latestMergeMapProc(source(port.terminate), sink(port.info),
      [source(port.browser)], async ([, browser]) =>
      ({close: await browser.close()}))

  eventFlow = (port: this) =>
    merge(...Object.entries(port.event).map(([name, sock]) =>
      fromEventProc(source(port.browser), sink(sock), name)))

  disconnectedFlow = (port: this) =>
    mapToProc(source(port.event.disconnected), sink(port.complete))
}

