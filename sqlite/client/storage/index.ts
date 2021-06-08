import {latestMergeMapProc, mapToProc, sink, source} from "@pkit/core";
import {SqliteStoragePort} from "../../";

export class SqliteClientStoragePort extends SqliteStoragePort {
  loadFlow = (port: this) =>
    latestMergeMapProc(source(port.load.req), sink(port.load.res),
      [source(port.init)], async ([, {sqlite}]) => {

        const res = await fetch(sqlite);
        const buf = await res.arrayBuffer();
        return new Uint8Array(buf);
      })

  saveFlow = (port: this) =>
    mapToProc(source(port.save.req), sink(port.save.res), null as any)
}
