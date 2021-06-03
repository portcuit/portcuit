import type {Stats} from 'fs'
import {watch, FSWatcher} from 'chokidar'
import {
  directProc,
  fromEventProc,
  latestMergeMapProc,
  Port,
  mapProc,
  mergeMapProc,
  sink,
  Socket,
  source
} from "@pkit/core";
import {merge} from "rxjs";

export class ChokidarPort extends Port {
  init = new Socket<Parameters<typeof watch>>();
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

  flow () {
    return chokidarKit(this);
  }
}

const chokidarKit = (port: ChokidarPort) =>
  merge(
    mapProc(source(port.init), sink(port.watcher), (args) =>
      watch(...args)),
    merge(...Object.entries(port.event).map(([key, value]) =>
      fromEventProc(source(port.watcher), source(port.terminated), sink(value), key, (...args) => args)
    )),
    directProc(source(port.event.ready), sink(port.ready)),
    latestMergeMapProc(source(port.terminate), sink(port.terminated),
      [source(port.watcher)],([,watcher]) =>
        watcher.close())
  )
