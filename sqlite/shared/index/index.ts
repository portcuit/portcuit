import initSqlJs from 'sql.js'
import {merge, Observable, race, from, lastValueFrom} from "rxjs";
import {delayWhen, filter, map, mapTo, switchMap, take} from "rxjs/operators";
import {
  DeepPartialPort,
  EndpointPort,
  latestMapProc, latestMergeMapProc,
  Port, mapProc,
  mapToProc, ofProc, PortMessage, PortParams,
  sink,
  Socket,
  source
} from "@pkit/core";
import {SqliteStoragePort} from "../storage/";

type Database = SqlJsDatabase<typeof initSqlJs>

export class SqlitePort extends Port {
  init = new Socket<{
    config?: { locateFile (file: string): string };
  } & PortParams<SqliteStoragePort>>();
  private db = new Socket<Database>();
  storage: SqliteStoragePort;
  session = new Socket<{port: SqliteClientPort, prepare: Prepare}>();
  save = new Socket<void>();

  async query <T, U extends {[key: string]: any}>({prepare, asObject, jsonKeys}: SqliteQueryUnit<T, U>, arg: T) {
    const client = new SqliteClientPort({log: this.log});

    return await lastValueFrom(ofProc(sink(this.session), ({port: client, prepare: prepare(arg)})).pipe(
      delayWhen(() =>
        from(new Promise((resolve) => client.injectedHook = resolve))),
      switchMap(() =>
        source(client.agent.query.res).pipe(
          map((result) =>
            asObject(result, jsonKeys)))),
      take(1)))
  }

  async command <T>({prepare}: SqliteCommandUnit<T>, arg: T) {
    const client = new SqliteClientPort({log: this.log});
    return await lastValueFrom(ofProc(sink(this.session), ({port: client, prepare: prepare(arg)})).pipe(
      delayWhen(() =>
        from(new Promise((resolve) => client.injectedHook = resolve))),
      switchMap(() =>
        source(client.agent.command.res).pipe(
          mapTo(undefined))),
      take(1)))
  }

  agentKit (port: this) {
    return latestMergeMapProc(source(port.session), sink(port.debug),
      [source(port.db), source(port.init)] as const, ([{port: client, prepare}, db, {saveOnCommand}]) => {

        const agent = new SqliteAgentPort({storage: port.storage, log: this.log});
        client.agent = agent

        return merge(
          agent.run({db, saveOnCommand}),
          client.run(prepare)
        )
      })
  }

  constructor(port: Omit<DeepPartialPort<SqlitePort>, 'storage'> & {storage: SqliteStoragePort}) {
    super(port);
    this.storage = port.storage;
  }

  flow() {
    const port = this;

    return merge(
      port.storage.flow(),

      mapProc(source(port.init), sink(port.storage.init),
        ({sqlite}) => ({sqlite})),

      mapToProc(source(port.storage.ready), sink(port.storage.load.req)),

      latestMergeMapProc(source(port.storage.load.res), sink(port.db),
        [source(port.init)], async ([buf, {config = {}}]) =>
          new (await initSqlJs(config)).Database(buf)) as Observable<PortMessage<any>>,

      mapToProc(source(port.db), sink(port.ready)),

      latestMapProc(source(port.save), sink(port.storage.save.req),
        [source(port.db)], ([,db]) =>
          db.export()),

      port.agentKit(port)
    )
  }
}

export abstract class ISqliteAgentPort extends Port {
  query = new EndpointPort<Prepare, any>();
  command = new EndpointPort<Prepare, void>();
}

class SqliteAgentPort extends ISqliteAgentPort {
  init = new Socket<{db: Database, saveOnCommand?: boolean}>();
  storage: SqlitePort['storage']

  constructor(port : DeepPartialPort<Omit<SqliteAgentPort, 'storage'>> & Pick<SqliteAgentPort, 'storage'>) {
    super(port);
    this.storage = port.storage;
  }

  namespace () {
    return '/sqlite/agent/'
  }

  flow() {
    const port = this;
    return merge(
      source(port.init).pipe(
        switchMap(({db, saveOnCommand}) => merge(
          mapProc(source(port.query.req), sink(port.query.res),
            ({sql, params}) =>
              db.exec(sql, params)),

          mapProc(source(port.command.req), sink(port.command.res),
            ({sql, params}) =>
              db.run(sql, params)),

          mapProc(source(port.command.res).pipe(
            filter(() => !!saveOnCommand)),
            sink(port.storage.save.req),
            () => db.export()),
        ))),

      mapToProc(race(source(port.query.res), source(port.command.res)),
        sink(port.terminate)),

      mapToProc(source(port.terminate), sink(port.complete))
    )
  }
}

export class SqliteClientPort extends Port {
  init = new Socket<Prepare>()
  agent!: ISqliteAgentPort;

  namespace() {
    return '/sqlite/client/'
  }

  flow() {
    return merge(
      source(this.init).pipe(
        switchMap((params) =>
          ofProc(sink(this.agent[params.type].req), params))),
      mapToProc(source(this.agent.complete).pipe(take(1)), sink(this.complete)),
    );
  }
}

export type SqliteQueryUnit<T, U> = {
  prepare: (arg: T) => Prepare<'query'>;
  asObject: AsObject<U>;
  jsonKeys?: ReadonlyArray<keyof U>;
}

export type SqliteCommandUnit<T> = {
  prepare: (arg: T) => Prepare<'command'>
}

type Prepare<T extends string = 'query' | 'command'> = {
  sql: string;
  params?: Array<string | number | Uint8Array | null>,
  type: T
}

type AsObject<T extends {[key: string]: any}> = {
  (data: Array<{columns: string[], values: any[][]}>, jsonKeys?: ReadonlyArray<keyof T>): Array<T>
}

export function asObject <T extends {[key: string]: any}>(data: Array<{columns: string[], values: any[][]}>, jsonKeys: ReadonlyArray<keyof T> = []) {
  if (!(data?.length >= 1)) { return []; }
  const [{columns, values}] = data;
  return values.map((fields) =>
    fields.reduce((memo, curr, index) =>
      ({
        ...memo,
        [columns[index]]: jsonKeys.includes(columns[index]) ? JSON.parse(curr) : curr
      }), {})) as T[];
}

type SqlJsDatabase<T extends {
  (config?: any): Promise<{
    Database: new(...args: any[]) => any
  }>;
  readonly default: any;
}> = InstanceType<InferDatabase<T>['Database']>

type InferDatabase<T> = T extends {
  (config?: any): Promise<infer I>;
  readonly default: any;
} ? I : never;
