import test from 'ava'
import {merge} from "rxjs";
import {take} from "rxjs/operators";
import {source, sink, mapToProc, IFlow} from "@pkit/core";
import {HttpServerPort} from "./";

type Flow = IFlow<HttpServerPort>

let i = 0;
for (const [name, testFlow] of Object.entries({
  '起動中に終了': <Flow>((port) =>
    mapToProc(source(port.started), sink(port.terminate))),

  'サーバを落としてから終了': <Flow>((port) => merge(
    mapToProc(source(port.started), sink(port.stop)),
    mapToProc(source(port.stopped), sink(port.terminate)))),

  '再スタートして、起動中に終了': <Flow>((port) => merge(
    mapToProc(source(port.started).pipe(take(1)), sink(port.restart)),
    mapToProc(source(port.restarted), sink(port.terminate))))
})) {
  test(name, async (t) => {
    await new HttpServerPort({
      testFlow,
      log: t.log,
      startServerFlow: <Flow>((port) =>
        mapToProc(source(port.ready), sink(port.start)))
    }).run({http: {listen: [18080 + i++]}}).toPromise()
    t.pass()
  })
}
