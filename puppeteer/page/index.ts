import {Container, fromEventProc, latestMergeMapProc, mapToProc, mergeMapProc, Port, PortParams, sink, Socket, source} from "@pkit/core";
import {Browser, Dialog, HTTPRequest, HTTPResponse, Page, Viewport} from "puppeteer-core";
import {identity} from 'ramda'
import {merge, of, concat} from 'rxjs'
import {toArray} from 'rxjs/operators'

export class PuppeteerPagePort extends Port {
  init = new Socket<{
    browser: Browser;
    userAgent?: string;
    viewport?: Viewport;
    goto?: Parameters<Page['goto']>;
    createNewPage?: boolean
  }>();
  page = new Socket<Page>();
  event = new class extends Container {
    load = new Socket<void>();
    close = new Socket<void>();
    response = new Socket<HTTPResponse>();
    request = new Socket<HTTPRequest>();
    dialog = new Socket<Dialog>();
  }

  pageInstanceFlow = (port: this, {createNewPage = true, browser}: PortParams<this>) =>
    mergeMapProc(of(createNewPage), sink(port.page), async (flag) =>
      flag ?
        (await browser.newPage()) :
        (await browser.pages())[0])

  readyFlow = (port: this, {userAgent, viewport, goto}: PortParams<this>) =>
    mergeMapProc(source(port.page), sink(port.ready),
      (page) =>
        concat(...[
          Promise.resolve('ready'),
          userAgent && page.setUserAgent(userAgent),
          viewport && page.setViewport(viewport),
          goto && page.goto(...goto),
        ].filter(identity) as Promise<any>[]).pipe(
          toArray()))

  eventFlow = (port: this) =>
    merge(...Container.entries(port.event).map(([name, sock]) =>
      fromEventProc(source(port.page), sink<void | HTTPResponse | HTTPRequest | Dialog>(sock), name)))

  // TODO: puppeteer-in-electron 使用時にヘッドありで開いた場合に page.close() で閉じずに実行結果が帰ってこない
  terminateFlow = (port: this) =>
    latestMergeMapProc(source(port.terminate), sink(port.info), [source(port.page)],
      async ([, page]) => ({close: await page.close()}))

  completeFlow = (port: this) =>
    mapToProc(source(port.event.close), sink(port.complete))
}
