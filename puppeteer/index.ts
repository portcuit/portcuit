import puppeteer, {Browser, Page, HTTPRequest, HTTPResponse, Target, Viewport, Dialog} from "puppeteer-core"
import {identity} from 'ramda';
import {concat, merge, of} from "rxjs";
import {filter, switchMap, takeUntil, toArray} from "rxjs/operators";
import {
  Port,
  sink,
  Socket,
  source,
  directProc,
  fromEventProc,
  latestMapProc,
  latestMergeMapProc,
  mapToProc,
  mergeMapProc,
  PortParams, ofProc
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
      puppeteerKit(port)
    )
  }
}

const puppeteerKit = (port: PuppeteerPort) =>
  source(port.init).pipe(
    switchMap((params) =>
      merge(
        ofProc(sink(port.browser.init), params),
        directProc(source(port.browser.ready), sink(port.ready)),
        latestMapProc(source(port.start), sink(port.page.init),
          [source(port.browser.browser)], ([,browser]) =>
            ({browser, ...params, createNewPage: false})),
        directProc(source(port.page.ready), sink(port.started)),
        directProc(source(port.stop), sink(port.page.terminate)),
        directProc(source(port.page.terminated), sink(port.stopped)),

        source(port.terminate).pipe(
          switchMap(() => merge(
            ofProc(sink(port.page.terminate)),
            mapToProc(source(port.stopped), sink(port.browser.terminate))
          ))),

        directProc(source(port.browser.terminated), sink(port.terminated)),
      ).pipe(takeUntil(source(port.terminated)))
    )
  )


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
      puppeteerBrowserKit(this)
    )
  }
}

const puppeteerBrowserKit = (port: PuppeteerBrowserPort) =>
  source(port.init).pipe(
    switchMap((params) => merge(
      mergeMapProc(of(params).pipe(
        filter(({launch}) => !!launch)),
        sink(port.browser), ({launch}) => puppeteer.launch(...launch!)),

      mapToProc(source(port.browser), sink(port.ready)),
      latestMergeMapProc(source(port.terminate), sink(port.info),
        [source(port.browser)], async ([,browser]) =>
          ({close: await browser.close()})),

      fromEventProc(source(port.browser), source(port.terminated), sink(port.event.targetcreated), 'targetcreated'),
      fromEventProc(source(port.browser), source(port.terminated), sink(port.event.disconnected), 'disconnected'),

      mapToProc(source(port.event.disconnected), sink(port.terminated)),

    ).pipe(takeUntil(source(port.terminated))))
  )

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
      puppeteerPageKit(this)
    )
  }
}

const puppeteerPageKit = (port: PuppeteerPagePort) =>
  source(port.init).pipe(
    switchMap(({browser, createNewPage=true, userAgent, viewport, goto}) => merge(
      mergeMapProc(of(true), sink(port.page),
        async () =>
          createNewPage ?
            (await browser.newPage()) :
            (await browser.pages())[0]),

      mergeMapProc(source(port.page), sink(port.ready),
        (page) =>
          concat(...[
            Promise.resolve('ready'),
            userAgent && page.setUserAgent(userAgent),
            viewport && page.setViewport(viewport),
            goto && page.goto(...goto),
          ].filter(identity) as Promise<any>[]).pipe(
            toArray())),

      fromEventProc(source(port.page), source(port.terminated), sink(port.event.load), 'load'),
      fromEventProc(source(port.page), source(port.terminated), sink(port.event.close), 'close'),
      fromEventProc(source(port.page), source(port.terminated), sink(port.event.response), 'response'),
      fromEventProc(source(port.page), source(port.terminated), sink(port.event.request), 'request'),
      fromEventProc(source(port.page), source(port.terminated), sink(port.event.dialog), 'dialog'),

      // TODO: puppeteer-in-electron 使用時にヘッドありで開いた場合に page.close() で閉じずに実行結果が帰ってこない
      latestMergeMapProc(source(port.terminate), sink(port.info), [source(port.page)],
        async([,page]) => ({close: await page.close()})),

      mapToProc(source(port.event.close), sink(port.terminated))
    ).pipe(takeUntil(source(port.terminated))))
  )
