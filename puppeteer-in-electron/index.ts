import fetch from 'node-fetch'
import pptr from "puppeteer-core";
import {mergeDeepLeft} from "ramda";
import {merge, zip} from "rxjs";
import {
  sink,
  source,
  Socket,
  Port,
  latestMapProc,
  latestMergeMapProc,
  mapToProc, PortParams,
  IPort
} from "@pkit/core";
import {PuppeteerPort} from "@pkit/puppeteer";
import {ElectronPort} from "@pkit/electron";

export * from './processors'

export interface IPiePort extends IPort<Port> {
  init: Socket<{
    piePort: {
      port: number;
      puppeteer?: PortParams<PuppeteerPort>;
      electron: PortParams<ElectronPort>;
    }
  }>;
  puppeteer: PuppeteerPort;
  electron: ElectronPort;
  kick: Socket<{headless: boolean}>
}

export const pureKit = (port: IPiePort) =>
  merge(
    latestMapProc(source(port.kick), sink(port.electron.init),
      [source(port.init)], ([{headless}, {piePort:{electron}}]) =>
        mergeDeepLeft({create: {show: !headless}}, electron)),

    latestMapProc(source(port.kick), sink(port.puppeteer.init),
      [source(port.init)], ([,{piePort:{puppeteer: {launch, ...puppeteer} = {launch: {}}}}]) =>
        ({...puppeteer, createNewPage: false})),

    mapToProc(source(port.electron.ready), sink(port.electron.start)),
    mapToProc(source(port.puppeteer.ready), sink(port.puppeteer.start)),

    mapToProc(zip(source(port.electron.browser.event.closed), source(port.puppeteer.browser.terminate)),
      sink(port.puppeteer.browser.terminated)),
  )

export const effectKit = (port: IPiePort) =>
  merge(
    latestMergeMapProc(source(port.electron.browser.started), sink(port.puppeteer.browser.browser),
      [source(port.init), source(port.electron.browser.win)] as const, async ([,{piePort: {port: portNum}}, win]) => {
        const res = await fetch(`http://127.0.0.1:${portNum}/json/version`);
        const version: {webSocketDebuggerUrl: string} = await res.json();

        const session = win.webContents.session;

        session.clearCache();
        await session.clearStorageData({storages:['cookies']});

        return await pptr.connect({
          browserWSEndpoint: version.webSocketDebuggerUrl,
          defaultViewport: null as any
        });
      }, sink(port.err))
  )

export namespace IPiePort {
  export const flow = (port: IPiePort) =>
    merge(
      port.electron.flow(),
      port.puppeteer.flow(),
      pureKit(port),
      effectKit(port)
    );
}
