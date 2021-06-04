import puppeteer, {Browser, Page, HTTPRequest, HTTPResponse, Target, Viewport, Dialog} from "puppeteer-core"
import {identity} from 'ramda';
import {concat, merge, of} from "rxjs";
import {filter, toArray} from "rxjs/operators";
import {
  Port,
  sink,
  Socket,
  source,
  directProc,
  latestMapProc,
  latestMergeMapProc,
  mapToProc,
  mergeMapProc,
  PortParams, ofProc, cycleFlow, fromEventProc
} from "@pkit/core";

export * from './processors'

export class PuppeteerPort extends Port {
  init = new Socket<Omit< PortParams<PuppeteerBrowserPort> & PortParams<PuppeteerPagePort>, 'browser'>>();
  browser = new PuppeteerBrowserPort;
  page = new PuppeteerPagePort;

  flow () {
    const port = this;
    return merge(
      super.flow(),
      port.browser.flow(),
      port.page.flow(),

      cycleFlow(this, 'init', 'terminated', {
        puppeteerFlow: (port, params) =>
          merge(
            ofProc(sink(port.browser.init), params),
            directProc(source(port.browser.ready), sink(port.ready)),
            latestMapProc(source(port.start), sink(port.page.init),
              [source(port.browser.browser)], ([, browser]) =>
              ({browser, ...params, createNewPage: false})),
            directProc(source(port.page.ready), sink(port.started)),

            directProc(source(port.stop), sink(port.page.terminate)),
            directProc(source(port.page.terminated), sink(port.stopped)),

            mapToProc(source(port.terminate), sink(port.browser.terminate)),

            // source(port.terminate).pipe(
            //   switchMap(() => merge(
            //     ofProc(sink(port.page.terminate)),
            //     mapToProc(source(port.stopped), sink(port.browser.terminate))
            //   ))),

            directProc(source(port.browser.terminated), sink(port.terminated)),
          )
      })
    )
  }
}


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

export class PuppeteerPagePort extends Port {
  init = new Socket<{
    browser: Browser;
    userAgent?: string;
    viewport?: Viewport;
    goto?: Parameters<Page['goto']>;
    createNewPage?: boolean
  }>();
  page = new Socket<Page>();
  event = new class {
    load = new Socket<void>();
    close = new Socket<void>();
    response = new Socket<HTTPResponse>();
    request = new Socket<HTTPRequest>();
    dialog = new Socket<Dialog>();
  }

  flow () {
    return merge(
      super.flow(),

      cycleFlow(this, 'init', 'terminated', {
        pageInstanceFlow: (port, {createNewPage=true, browser}) =>
          mergeMapProc(of(createNewPage), sink(port.page), async (flag) => 
            flag ? 
            (await browser.newPage()) :
            (await browser.pages())[0]),

        readyFlow: (port, {userAgent, viewport, goto}) =>
          mergeMapProc(source(port.page), sink(port.ready),
            (page) =>
              concat(...[
                Promise.resolve('ready'),
                userAgent && page.setUserAgent(userAgent),
                viewport && page.setViewport(viewport),
                goto && page.goto(...goto),
              ].filter(identity) as Promise<any>[]).pipe(
                toArray())),

        eventFlow: (port) =>
          merge(...Object.entries(port.event).map(([name, sock]) => 
            fromEventProc(source(port.page), sink(sock), name))),

        // TODO: puppeteer-in-electron 使用時にヘッドありで開いた場合に page.close() で閉じずに実行結果が帰ってこない
        terminateFlow: (port) =>
          latestMergeMapProc(source(port.terminate), sink(port.info), [source(port.page)],
            async ([, page]) => ({close: await page.close()})),

        terminatedFlow: (port) =>
          mapToProc(source(port.event.close), sink(port.terminated))
      })
    )
  }
}
