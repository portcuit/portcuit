import initSqlJs from 'sql.js'
import {race} from 'rxjs'
import {filter} from 'rxjs/operators'
import {DeepPartialPort, EndpointPort, mapProc, mapToProc, Port, PortParams, sink, Socket, source} from "@pkit/core";
import {Prepare, SqlJsDatabase} from "../lib";
import {SqlitePort} from '../index/';

export abstract class ISqliteAgentPort extends Port {
  query = new EndpointPort<Prepare, any>();
  command = new EndpointPort<Prepare, void>();
}

export class SqliteAgentPort extends ISqliteAgentPort {
  init = new Socket<{db: SqlJsDatabase<typeof initSqlJs>, saveOnCommand?: boolean}>();
  storage: SqlitePort['storage']

  namespace () {
    return '/sqlite/agent/'
  }

  constructor (port: DeepPartialPort<Omit<SqliteAgentPort, 'storage'>> & Pick<SqliteAgentPort, 'storage'>) {
    super(port);
    this.storage = port.storage;
  }

  requestQueryFlow = (port: this, {db}: PortParams<this>) =>
    mapProc(source(port.query.req), sink(port.query.res),
      ({sql, params}) =>
        db.exec(sql, params))

  requestCommandFlow = (port: this, {db}: PortParams<this>) =>
    mapProc(source(port.command.req), sink(port.command.res),
      ({sql, params}) =>
        db.run(sql, params))

  exportFlow = (port: this, {db, saveOnCommand}: PortParams<this>) =>
    mapProc(source(port.command.res).pipe(
      filter(() => !!saveOnCommand)),
      sink(port.storage.save.req),
      () => db.export())

  terminateFlow = (port: this) =>
    mapToProc(race(source(port.query.res), source(port.command.res)),
      sink(port.terminate))

  completeFlow = (port: this) =>
    mapToProc(source(port.terminate), sink(port.complete))
}
