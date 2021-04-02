import {PuppeteerPort} from "./index";
import {merge} from "rxjs";
import {PortMessage, sink, source, tuple, mapToProc} from "@pkit/core";
import {delay, filter, toArray} from "rxjs/operators";

class PuppeteerTestPort extends PuppeteerPort {
  circuit() {
    const port = this;
    return merge(
      super.circuit(),
      mapToProc(source(port.ready), sink(port.start)),
      mapToProc(source(port.running).pipe(
        filter((running) =>
          running)), sink(port.stop)),
      mapToProc(source(port.stopped), sink(port.terminate)),
    )
  }

  includes() { return []; }
}

const testAssert = (res: PortMessage<any>[]) => {
  console.log('ok')
}

export const test = async () => {
  let res = await new PuppeteerTestPort().stream({
    launch: tuple({
      headless: false,
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    }),
    goto: tuple('http://www.google.com')
  }).pipe(toArray()).toPromise();

  testAssert(res);
}

test();
