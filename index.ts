import puppeteer from "puppeteer/lib/cjs/puppeteer";
import {Browser} from "puppeteer/lib/cjs/puppeteer/common/Browser";
import {Page} from "puppeteer/lib/cjs/puppeteer/common/Page";
import {HTTPRequest} from "puppeteer/lib/cjs/puppeteer/common/HTTPRequest";
import {HTTPResponse} from "puppeteer/lib/cjs/puppeteer/common/HTTPResponse";
import {Target} from "puppeteer/lib/cjs/puppeteer/common/Target";
import {Viewport} from "puppeteer/lib/cjs/puppeteer/common/PuppeteerViewport";
import {identity} from 'ramda';
import {concat, merge} from "rxjs";
import {LifecyclePort, sink, Socket, source} from "pkit/core";
import {fromEventProc, latestMergeMapProc, mapToProc, mergeMapProc} from "pkit/processors";
import {delay, toArray} from "rxjs/operators";

export type PuppeteerBrowserParams = {
  launch: Readonly<Parameters<typeof puppeteer.launch>>
}

export class PuppeteerBrowserPort extends LifecyclePort<PuppeteerBrowserParams> {
  browser = new Socket<Browser>();
  event = new class {
    targetcreated = new Socket<Target>();
    disconnected = new Socket<void>();
  }
}

export type PuppeteerPageParams = {
  userAgent?: string;
  viewport?: Viewport;
  goto?: Parameters<Page['goto']>
}

export class PuppeteerPagePort extends LifecyclePort<PuppeteerPageParams> {
  page = new Socket<Page>();
  event = new class {
    load = new Socket<void>();
    close = new Socket<void>();
    response = new Socket<HTTPResponse>();
    request = new Socket<HTTPRequest>();
  }
  info = new Socket<any>();
}

export const puppeteerBrowserKit = (port: PuppeteerBrowserPort) =>
  merge(
    mergeMapProc(source(port.init), sink(port.browser),
      ({launch}) => puppeteer.launch(...launch)),
    mapToProc(source(port.browser).pipe(delay(0)), sink(port.ready)),
    latestMergeMapProc(source(port.terminate), sink(port.info), [source(port.browser)],
      async ([,browser]) => ({close: await browser.close()})),
    fromEventProc(source(port.browser), sink(port.event.targetcreated), 'targetcreated'),
    fromEventProc(source(port.browser), sink(port.event.disconnected), 'disconnected'),
    mapToProc(source(port.event.disconnected), sink(port.terminated)),
  )

export const puppeteerPageKit = (port: PuppeteerPagePort, browser: PuppeteerBrowserPort) =>
  merge(
    latestMergeMapProc(source(port.init), sink(port.page), [source(browser.browser)],
      ([,browser]) => browser.newPage()),

    latestMergeMapProc(source(port.page), sink(port.ready), [source(port.init)],
      ([page, {userAgent, viewport, goto}]) =>
          concat(...[
            Promise.resolve('ready'),
            userAgent && page.setUserAgent(userAgent),
            viewport && page.setViewport(viewport),
            goto && page.goto(...goto),
          ].filter(identity) as Promise<any>[]).pipe(
            toArray())),

    fromEventProc(source(port.page), sink(port.event.load), 'load'),
    fromEventProc(source(port.page), sink(port.event.close), 'close'),
    fromEventProc(source(port.page), sink(port.event.response), 'response'),
    fromEventProc(source(port.page), sink(port.event.request), 'request'),

    latestMergeMapProc(source(port.terminate), sink(port.info), [source(port.page)],
      async([,page]) => ({close: await page.close()})),

    mapToProc(source(port.event.close), sink(port.terminated))
  )