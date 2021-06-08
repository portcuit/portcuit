import {readFile, writeFile} from "fs/promises";
import {mergeMapProc, PortParams, sink, source} from "@pkit/core";
import {SqliteStoragePort} from "../../";

export class SqliteServerStoragePort extends SqliteStoragePort {
  loadFlow = (port: this, {sqlite}: PortParams<this>) =>
    mergeMapProc(source(port.load.req), sink(port.load.res),
      async () =>
        await (readFile(sqlite) as Promise<Uint8Array>))

  saveFlow = (port: this, {sqlite}: PortParams<this>) =>
    mergeMapProc(source(port.save.req), sink(port.save.res),
      async (buffer) =>
        await writeFile(sqlite, buffer))
}
