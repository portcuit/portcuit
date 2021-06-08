import initSqlJs from 'sql.js'
import {merge} from "rxjs";
import {DeepPartialPort, Port, PortParams, Socket} from "@pkit/core";
import {SqliteStoragePort} from "../storage/";
import {Prepare, SqlJsDatabase} from '../lib';
import {SqliteClientPort} from '../client/index';
import * as mixin from './mixin'

export class SqlitePort extends Port {
  init = new Socket<{
    config?: {locateFile (file: string): string}
  } & PortParams<SqliteStoragePort>>()
  db = new Socket<SqlJsDatabase<typeof initSqlJs>>()
  storage: SqliteStoragePort
  session = new Socket<{port: SqliteClientPort, prepare: Prepare}>()
  save = new Socket<void>();

  constructor (port: Omit<DeepPartialPort<SqlitePort>, 'storage'> & {storage: SqliteStoragePort}) {
    super(port)
    this.storage = port.storage
  }

  query = mixin.query
  command = mixin.command

  flow () {
    return merge(
      super.flow(),
      this.storage.flow()
    )
  }
}

Object.assign(SqlitePort.prototype, mixin)