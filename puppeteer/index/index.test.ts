import test from 'ava'
import {PuppeteerPort} from "./index";
import {merge} from "rxjs";
import {PortMessage, sink, source, tuple, mapToProc, cycleFlow} from "@pkit/core";
import {delay, filter, toArray} from "rxjs/operators";

class PuppeteerTestPort extends PuppeteerPort {
  flow() {
    return merge(
      super.flow(),
      
      cycleFlow(this, 'init', 'terminate', {
        testFlow: (port) => merge(
          mapToProc(source(port.ready), sink(port.start)),
          mapToProc(source(port.running).pipe(
            filter((running) =>
              running)), sink(port.stop)),
          mapToProc(source(port.stopped), sink(port.terminate))
        )
      })
    )
  }

  includes() { return []; }
}

const testAssert = (res: PortMessage<any>[]) => {
  console.log('ok')
}

test('test', async (t) => {
  let res = await new PuppeteerTestPort().run({
    launch: [{
      headless: false,
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    }],
    goto: tuple('http://www.google.com')
  }).pipe(toArray()).toPromise();

  t.pass();
})
