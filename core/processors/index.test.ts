import test, {ExecutionContext} from 'ava'
import {merge, lastValueFrom, zip} from 'rxjs'
import {sink, Socket, source} from "../lib";
import {Port} from "../port/index";
import {directProc, latestMergeMapProc, mapToProc, ofProc} from "./lib";

class ProcessorsTestPort extends Port {
  init = new Socket<ExecutionContext>();
  strCache = new Socket<string>()
  numCache = new Socket<number>()
  popValue = new Socket<string>()

  testFlow = (port: this) =>
    merge(
      ofProc(sink(port.strCache), 'a'),
      ofProc(sink(port.numCache), 1),

      mapToProc(zip(source(port.strCache), source(port.numCache)), sink(port.popValue), 'pop'),

      latestMergeMapProc(source(port.popValue), sink(port.complete),
        [source(port.strCache), source(port.numCache)] as const,
        async ([a, b, c]) => {
          throw new Error("errro")
          return await Promise.resolve({a, b, c})
        }, sink(port.err)),

      directProc(source(port.err), sink(port.complete))
    )
}

test('latestMergeMapProc', async (t) => {
  await lastValueFrom(new ProcessorsTestPort({log: t.log}).run(t))
  t.pass()
})
