import {merge} from "rxjs";
import {sink, Socket, source} from "pkit/core";
import {filterProc} from "pkit/processors";
import {restartProc} from './processors';

export class RunPort {
  start = new Socket<boolean>();
  started = new Socket<any>();
  stop = new Socket<boolean>();
  stopped = new Socket<any>();
  // TODO: running を受けて、startedが発行されるまでの間にrestartされたら例外を発行するとか？
  restart = new Socket<any>();
  restarted = new Socket<any>();
}

// TODO: distinctを実装 filterDistinctProc とか？
export const runKit = (port: RunPort, running: Socket<boolean>) =>
  merge(
    filterProc(source(running), sink(port.start), (running) => running),
    filterProc(source(running), sink(port.stop), (running) => !running),
    restartProc(source(port.restart), source(running),
      source(port.stopped), source(port.started),
      sink(running), sink(port.restarted))
  )