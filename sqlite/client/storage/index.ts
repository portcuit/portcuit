import {mapToProc, mergeMapProc, PortParams, sink, source} from "@pkit/core";
import {SqliteStoragePort} from "../../";

export class SqliteClientStoragePort extends SqliteStoragePort {
  loadFlow = (port: this, {sqlite}: PortParams<this>) =>
    mergeMapProc(source(port.load.req), sink(port.load.res),
      async () => {
        const res = await fetch(sqlite);
        const buf = await res.arrayBuffer();
        return new Uint8Array(buf);
      })

  saveFlow = (port: this, _: PortParams<this>) =>
    mapToProc(source(port.save.req), sink(port.save.res), null as any)
}
