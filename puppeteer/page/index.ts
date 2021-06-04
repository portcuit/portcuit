import {cycleFlow, fromEventProc, latestMergeMapProc, mapToProc, mergeMapProc, Port, sink, Socket, source} from "@pkit/core";
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
