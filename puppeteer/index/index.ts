import {merge} from "rxjs";
import {
  Port,
  sink,
  Socket,
  source,
  directProc,
  latestMapProc,
  mapToProc,
  PortParams, ofProc, cycleFlow
} from "@pkit/core";
import {PuppeteerBrowserPort} from "../browser/";
import {PuppeteerPagePort} from "../page/";

export * from "./processors"

export class PuppeteerPort extends Port {
  init = new Socket<Omit<PortParams<PuppeteerBrowserPort> & PortParams<PuppeteerPagePort>, 'browser'>>();
  browser = new PuppeteerBrowserPort;
  page = new PuppeteerPagePort;

  flow () {
    return merge(
      super.flow(),
      this.browser.flow(),
      this.page.flow(),

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
