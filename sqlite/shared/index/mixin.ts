import initSqlJs from 'sql.js'
import {lastValueFrom, from, merge} from 'rxjs'
import {delayWhen, switchMap, map, take, mapTo} from 'rxjs/operators'
import {IFlow, latestMapProc, latestMergeMapProc, mapToProc, mergeMapProc, ofProc, sink, source} from "@pkit/core";
import {SqliteCommandUnit, SqliteQueryUnit} from "../lib";
import {SqliteAgentPort} from '../agent/';
import {SqliteClientPort} from "../client/";
import {SqlitePort} from "./";

type Flow = IFlow<SqlitePort>

export async function query<T, U extends {[key: string]: any}> (this: SqlitePort, {prepare, asObject, jsonKeys}: SqliteQueryUnit<T, U>, arg: T) {
  const client = new SqliteClientPort({log: this.log});
  const stream$ = ofProc(sink(this.session), ({port: client, prepare: prepare(arg)})).pipe(
    delayWhen(() =>
      from(new Promise((resolve) => client.injectedHook = resolve))),
    switchMap(() =>
      source(client.agent.query.res).pipe(
        map((result) =>
          asObject(result, jsonKeys)))),
    take(1))
  return await lastValueFrom(stream$)
}

export async function command<T> (this: SqlitePort, {prepare}: SqliteCommandUnit<T>, arg: T) {
  const client = new SqliteClientPort({log: this.log});
  const stream$ = ofProc(sink(this.session), ({port: client, prepare: prepare(arg)})).pipe(
    delayWhen(() =>
      from(new Promise((resolve) => client.injectedHook = resolve))),
    switchMap(() =>
      source(client.agent.command.res).pipe(
        mapTo(undefined))),
    take(1))
  return await lastValueFrom(stream$)
}

export const agentFlow: Flow = (port, {saveOnCommand}) =>
  latestMergeMapProc(source(port.session), sink(port.debug),
    [source(port.db)], ([{port: client, prepare}, db]) => {
      const agent = new SqliteAgentPort({storage: port.storage, log: port.log});
      client.agent = agent
      return merge(
        agent.run({db, saveOnCommand}),
        client.run(prepare)
      )
    })

export const initialStoragePortFlow: Flow = (port, {sqlite}) =>
  ofProc(sink(port.storage.init), {sqlite})

export const startLoadStorageFlow: Flow = (port) =>
  mapToProc(source(port.storage.ready), sink(port.storage.load.req))

export const finishStorageLoadFlow: Flow = (port, {config = {}}) =>
  mergeMapProc(source(port.storage.load.res), sink(port.db),
    async (buf) =>
      new (await initSqlJs(config)).Database(buf))

export const readyFlow: Flow = (port) =>
  mapToProc(source(port.db), sink(port.ready))

export const exportFlow: Flow = (port) =>
  latestMapProc(source(port.save), sink(port.storage.save.req),
    [source(port.db)], ([, db]) =>
    db.export())
