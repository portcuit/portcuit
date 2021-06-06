import test from 'ava'
import {PuppeteerPort} from "./index";
import {merge} from "rxjs";
import {filter} from "rxjs/operators";
import {sink, source, tuple, mapToProc} from "@pkit/core";

class PuppeteerTestPort extends PuppeteerPort {
  testFlow = (port: this) =>
    merge(
      mapToProc(source(port.ready), sink(port.start)),
      mapToProc(source(port.running).pipe(
        filter((running) =>
          running)), sink(port.stop)),
      mapToProc(source(port.stopped), sink(port.terminate))
    )
}

test('start and stop', async (t) => {
  await new PuppeteerTestPort({log: t.log}).run({
    launch: [{
      headless: false,
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    }],
    goto: tuple('http://www.google.com'),
  }).toPromise();

  t.pass();
})
