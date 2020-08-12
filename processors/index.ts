import {merge} from "rxjs";
import {source, sink, Socket} from "pkit/core";
import {filterProc} from "./processors";

export * from './processors'

export class RunPort {
  start = new Socket<any>();
  started = new Socket<any>();
  stop = new Socket<any>();
  stopped = new Socket<any>();
}

// TODO: distinctを実装 filterDistinctProc とか？
export const runKit = (port: RunPort, running: Socket<boolean>) =>
  merge(
    filterProc(source(running), sink(port.start), (running) => running),
    filterProc(source(running), sink(port.stop), (running) => !running)
  )