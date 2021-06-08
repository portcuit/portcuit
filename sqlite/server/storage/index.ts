import {readFile, writeFile} from "fs/promises";
import {
  latestMergeMapProc,
  sink,
  source
} from "@pkit/core";
import {SqliteStoragePort} from "../../";

export class SqliteServerStoragePort extends SqliteStoragePort {
  loadFlow = (port: this) =>
    latestMergeMapProc(source(port.load.req), sink(port.load.res),
      [source(port.init)], async ([, {sqlite}]) =>
      await readFile(sqlite))

  saveFlow = (port: this) =>
    latestMergeMapProc(source(port.save.req), sink(port.save.res),
      [source(port.init)], async ([buffer, {sqlite}]) =>
      await writeFile(sqlite, buffer))
}
