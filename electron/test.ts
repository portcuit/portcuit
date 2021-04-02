import {ElectronPort} from "./index";
import {merge} from "rxjs";
import {filter, startWith, toArray} from "rxjs/operators";
import {sink, source, tuple, latestMapProc, mapToProc} from "@pkit/core";

class ElectronTestPort extends ElectronPort {
  circuit() {
    const port = this;
    return merge(
      super.circuit(),
      mapToProc(source(port.ready), sink(port.start)),
      mapToProc(source(port.running).pipe(
        filter((running) =>
          running)), sink(port.stop)),
      latestMapProc(source(port.app.event.willQuit), sink(port.info),
        [source(port.terminating).pipe(startWith(false))] as const, ([ev, terminating]) =>
          ({
            'preventQuit': terminating ? null : ev.preventDefault(),
            terminating
          })
      ),
      mapToProc(source(port.stopped), sink(port.terminate))
    )
  }
}

export const test = async () => {
  await new ElectronTestPort().stream({
    app: {},
    create: {width: 800, height: 800},
    loadURL: tuple('https://www.google.co.jp')
  }).pipe(toArray()).toPromise()
}

test();
