import initSqlJs from 'sql.js'
import {merge, race} from 'rxjs'
import {filter} from 'rxjs/operators'
import {DeepPartialPort, EndpointPort, mapProc, mapToProc, Port, PortParams, sink, Socket, source} from "@pkit/core";
import {Prepare, SqlJsDatabase} from "../lib";
import {SqlitePort} from '../index/';

type Database = SqlJsDatabase<typeof initSqlJs>

export abstract class ISqliteAgentPort extends Port {
  query = new EndpointPort<Prepare, any>();
  command = new EndpointPort<Prepare, void>();
}

export class SqliteAgentPort extends ISqliteAgentPort {
  init = new Socket<{db: Database, saveOnCommand?: boolean}>();
  storage: SqlitePort['storage']

  namespace () {
    return '/sqlite/agent/'
  }

  constructor (port: DeepPartialPort<Omit<SqliteAgentPort, 'storage'>> & Pick<SqliteAgentPort, 'storage'>) {
    super(port);
    this.storage = port.storage;
  }

  agentFlow = (port: this, {db, saveOnCommand}: PortParams<this>) =>
    merge(
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

      mapToProc(race(source(port.query.res), source(port.command.res)),
        sink(port.terminate)),

      mapToProc(source(port.terminate), sink(port.complete))
    )

}
