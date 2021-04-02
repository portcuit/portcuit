import puppeteer, {Browser, Page, HTTPRequest, HTTPResponse, Target, Viewport, Dialog} from "puppeteer-core"
import {identity} from 'ramda';
import {concat, merge} from "rxjs";
import {filter, toArray} from "rxjs/operators";
import {
  LifecyclePort,
  sink,
  Socket,
  source,
  directProc,
  fromEventProc,
  latestMapProc,
  latestMergeMapProc,
  mapToProc,
  mergeMapProc,
  PortParams
} from "@pkit/core";

export * from './processors'

export class PuppeteerPort extends LifecyclePort {
  init = new Socket<Omit< PortParams<PuppeteerBrowserPort> & PortParams<PuppeteerPagePort>, 'browser'>>();
  browser = new PuppeteerBrowserPort;
  page = new PuppeteerPagePort;

  circuit () {
    return merge(
      super.circuit(),
      puppeteerKit(this)
    )
  }
}

const puppeteerKit = (port: PuppeteerPort) =>
  merge(
    port.browser.circuit(),
    port.page.circuit(),
    directProc(source(port.init), sink(port.browser.init)),
    directProc(source(port.browser.ready), sink(port.ready)),
    latestMapProc(source(port.start), sink(port.page.init),
      [source(port.init), source(port.browser.browser)] as const, ([,page, browser]) =>
        ({browser, ...page, createNewPage: false})),
    directProc(source(port.page.ready), sink(port.started)),
    directProc(source(port.stop), sink(port.page.terminate)),
    directProc(source(port.page.terminated), sink(port.stopped)),
    directProc(source(port.terminate), sink(port.browser.terminate)),
    directProc(source(port.browser.terminated), sink(port.terminated)),
  )

export class PuppeteerBrowserPort extends LifecyclePort {
  init = new Socket<{
    launch?: Readonly<Parameters<typeof puppeteer.launch>>
  }>();
  browser = new Socket<Browser>();
  event = new class {
    targetcreated = new Socket<Target>();
    disconnected = new Socket<void>();
  }

  circuit () {
    return merge(
      super.circuit(),
      puppeteerBrowserKit(this)
    )
  }
}

const puppeteerBrowserKit = (port: PuppeteerBrowserPort) =>
  merge(
    mergeMapProc(source(port.init).pipe(
      filter(({launch}) =>
        !!launch)),
      sink(port.browser), ({launch}) =>
        puppeteer.launch(...launch!)),

    mapToProc(source(port.browser), sink(port.ready)),
    latestMergeMapProc(source(port.terminate), sink(port.info),
      [source(port.browser)], async ([,browser]) =>
        ({close: await browser.close()})),

    fromEventProc(source(port.browser), source(port.terminated), sink(port.event.targetcreated), 'targetcreated'),
    fromEventProc(source(port.browser), source(port.terminated), sink(port.event.disconnected), 'disconnected'),

    mapToProc(source(port.event.disconnected), sink(port.terminated)),
  )

export class PuppeteerPagePort extends LifecyclePort {
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

  circuit () {
    return merge(
      super.circuit(),
      puppeteerPageKit(this)
    )
  }
}

const puppeteerPageKit = (port: PuppeteerPagePort) =>
  merge(
    mergeMapProc(source(port.init), sink(port.page),
      async ({browser, createNewPage = true}) =>
        createNewPage ?
          (await browser.newPage()) :
          (await browser.pages())[0]),

    latestMergeMapProc(source(port.page), sink(port.ready), [source(port.init)],
      ([page, {userAgent, viewport, goto}]) =>
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
  )