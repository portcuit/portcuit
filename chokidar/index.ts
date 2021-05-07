import type {Stats} from 'fs'
import chokidar, {FSWatcher} from 'chokidar'
import {
  directProc,
  fromEventProc,
  latestMergeMapProc,
  LifecyclePort,
  mapProc,
  mergeMapProc,
  sink,
  Socket,
  source
} from "pkit";
import {merge} from "rxjs";

type ChokidarParams = Parameters<typeof chokidar.watch>

export class ChokidarPort extends LifecyclePort<ChokidarParams> {
  watcher = new Socket<FSWatcher>();
  event = new class {
    all = new Socket<[eventName: 'add'|'addDir'|'change'|'unlink'|'unlinkDir', path: string, stats?: Stats]>();
    add = new Socket<[path: string, stats?: Stats]>();
    change = new Socket<[path: string, stats?: Stats]>();
    unlink = new Socket<[path: string]>();
    addDir = new Socket<[path: string, stats?: Stats]>();
    unlinkDir = new Socket<[path: string]>();
    error = new Socket<[error: Error]>();
    ready = new Socket<void>();
    raw = new Socket<[eventName: string, path: string, details: any]>();
  }
}

export const chokidarKit = (port: ChokidarPort) =>
  merge(
    mapProc(source(port.init), sink(port.watcher), (args) =>
      chokidar.watch(...args)),
    merge(...Object.entries(port.event).map(([key, value]) =>
      fromEventProc(source(port.watcher), sink(value), key)
    )),
    directProc(source(port.event.ready), sink(port.ready)),
    latestMergeMapProc(source(port.terminate), sink(port.terminated),
      [source(port.watcher)],([,watcher]) =>
        watcher.close())
  )

export default [ChokidarPort, chokidarKit]