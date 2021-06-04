import puppeteer, {Browser, Target} from 'puppeteer-core'
import {merge, of} from 'rxjs'
import {filter} from 'rxjs/operators'
import {cycleFlow, fromEventProc, latestMergeMapProc, mapToProc, mergeMapProc, Port, sink, Socket, source} from "@pkit/core";

export class PuppeteerBrowserPort extends Port {
  init = new Socket<{
    launch?: Readonly<Parameters<typeof puppeteer.launch>>
  }>();
  browser = new Socket<Browser>();
  event = new class {
    targetcreated = new Socket<Target>();
    disconnected = new Socket<void>();
  }

  flow () {
    return merge(
      super.flow(),

      cycleFlow(this, 'init', 'terminated', {
        launchFlow: (port, params) =>
          mergeMapProc(of(params).pipe(
            filter(({launch}) => !!launch)),
            sink(port.browser), ({launch}) => puppeteer.launch(...launch!)),

        readyFlow: (port) =>
          mapToProc(source(port.browser), sink(port.ready)),

        terminateFlow: (port) =>
          latestMergeMapProc(source(port.terminate), sink(port.info),
            [source(port.browser)], async ([, browser]) =>
            ({close: await browser.close()})),

        eventFlow: (port) =>
          merge(...Object.entries(port.event).map(([name, sock]) => 
            fromEventProc(source(port.browser), sink(sock), name))),

        disconnectedFlow: (port) =>
          mapToProc(source(port.event.disconnected), sink(port.terminated))
      })
    )
  }
}

