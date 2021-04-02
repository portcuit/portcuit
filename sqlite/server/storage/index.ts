import {readFile, writeFile} from "fs/promises";
import {merge} from "rxjs";
import {
  EndpointPort,
  latestMergeMapProc,
  mapToProc,
  sink,
  source
} from "@pkit/core";
import {SqliteStoragePort} from "../../";

export class SqliteServerStoragePort extends SqliteStoragePort {
  load = new EndpointPort<void, Uint8Array>();
  save = new EndpointPort<Uint8Array, void>();

  loadKit(port: this) {
    return latestMergeMapProc(source(port.load.req), sink(port.load.res),
      [source(port.init)], async ([,{sqlite}]) =>
        await readFile(sqlite))
  }

  saveKit(port: this) {
    return latestMergeMapProc(source(port.save.req), sink(port.save.res),
      [source(port.init)], async ([buffer, {sqlite}]) =>
        await writeFile(sqlite, buffer))
  }

  circuit() {
    return merge(
      mapToProc(source(this.init), sink(this.ready)),
      this.loadKit(this),
      this.saveKit(this)
    )
  }
}
