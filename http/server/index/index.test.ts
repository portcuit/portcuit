import test from 'ava'
import {merge} from "rxjs";
import {take} from "rxjs/operators";
import {source, sink, mapToProc, cycleFlow, IPort, IFlow, DeepPartialPort} from "@pkit/core";
import {HttpServerPort} from "./";

class HttpServerTestPort extends HttpServerPort {
  testFlow: Flow

  constructor (port: DeepPartialPort<Omit<HttpServerTestPort, 'testFlow'>> & Pick<HttpServerTestPort, 'testFlow'>) {
    super(port)
    this.testFlow = port.testFlow
  }

  flow () {
    return merge(
      super.flow(),
      cycleFlow(this, 'init', 'terminated', {
        readyFlow: (port) =>
          mapToProc(source(port.ready), sink(port.start))
      })
    )
  }
}

type IHttpServerTestPort = IPort<HttpServerTestPort>
type Flow = IFlow<IHttpServerTestPort>

for (const [name, testFlow] of Object.entries({
  senarioA: <Flow>((port) =>
    mapToProc(source(port.started), sink(port.terminate))),

  senarioB: <Flow>((port) => merge(
    mapToProc(source(port.started), sink(port.stop)),
    mapToProc(source(port.stopped), sink(port.terminate)))),

  senarioC: <Flow>((port) => merge(
    mapToProc(source(port.started).pipe(take(1)), sink(port.restart)),
    mapToProc(source(port.restarted), sink(port.terminate))))
})) {
  test.serial(name, async (t) => {
    new HttpServerTestPort({testFlow, log: t.log}).run({http: {listen: [18080]}})
    t.pass()
  })
}
