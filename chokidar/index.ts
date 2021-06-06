import type {Stats} from 'fs'
import {watch, FSWatcher} from 'chokidar'
import {merge} from "rxjs";
import {
  directProc,
  latestMergeMapProc,
  Port,
  sink,
  Socket,
  source,
  cycleFlow,
  ofProc,
  fromEventProc
} from "@pkit/core";


export class ChokidarPort extends Port {
  init = new Socket<{
    watch: Parameters<typeof watch>
  }>();
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
    return cycleFlow(this, 'init', 'complete', {
      startWatchFlow: (port, {watch: chokidar}) =>
        ofProc(sink(port.watcher), watch(...chokidar)),

      readyFlow: (port) =>
        directProc(source(port.event.ready), sink(port.ready)),

      eventFlow: (port) => 
        merge(...Object.entries(port.event).map(([name, sock]) => 
            fromEventProc(source(port.watcher), sink(sock), name, (...args) => args))),

      terminateFlow: (port) =>
        latestMergeMapProc(source(port.terminate), sink(port.complete),
          [source(port.watcher)], ([, watcher]) =>
          watcher.close())
    })
  }
}
