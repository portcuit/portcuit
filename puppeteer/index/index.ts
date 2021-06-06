import {merge} from "rxjs";
import {
  sink,
  Socket,
  source,
  directProc,
  latestMapProc,
  mapToProc,
  PortParams, ofProc, LifecyclePort
} from "@pkit/core";
import {PuppeteerBrowserPort} from "../browser/";
import {PuppeteerPagePort} from "../page/";

export class PuppeteerPort extends LifecyclePort {
  init = new Socket<Omit<PortParams<PuppeteerBrowserPort> & PortParams<PuppeteerPagePort>, 'browser'>>();
  browser = new PuppeteerBrowserPort;
  page = new PuppeteerPagePort;

  initBrowserFlow = (port: this, params: PortParams<this>) =>
    ofProc(sink(port.browser.init), params)

  readyFlow = (port: this) =>
    directProc(source(port.browser.ready), sink(port.ready))

  initPageFlow = (port: this, params: PortParams<this>) =>
    latestMapProc(source(port.start), sink(port.page.init),
      [source(port.browser.browser)], ([, browser]) =>
      ({browser, ...params, createNewPage: false}))

  finishStartFlow = (port: this) =>
    directProc(source(port.page.ready), sink(port.started))

  startStopFlow = (port: this) =>
    directProc(source(port.stop), sink(port.page.terminate))

  finishStopFlow = (port: this) =>
    directProc(source(port.page.terminated), sink(port.stopped))

  terminateFlow = (port: this) =>
    mapToProc(source(port.terminate), sink(port.browser.terminate))

  completeFlow = (port: this) =>
    directProc(source(port.browser.terminated), sink(port.terminated))

  // TODO: ページがない状態、ブラウザがない状態、一度もstartされない状態でterminateされた場合の考慮
  // source(port.terminate).pipe(
  //   switchMap(() => merge(
  //     ofProc(sink(port.page.terminate)),
  //     mapToProc(source(port.stopped), sink(port.browser.terminate))
  //   ))),

  flow () {
    return merge(
      super.flow(),
      this.browser.flow(),
      this.page.flow(),
    )
  }
}