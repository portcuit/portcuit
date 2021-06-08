import {take} from 'rxjs/operators'
import {mapToProc, ofProc, Port, PortParams, sink, Socket, source} from "@pkit/core";
import {ISqliteAgentPort} from "../agent/";
import {Prepare} from '../lib';

export class SqliteClientPort extends Port {
  init = new Socket<Prepare>()
  agent!: ISqliteAgentPort;

  namespace () {
    return '/sqlite/client/'
  }

  startAgentFlow = (port: this, params: PortParams<this>) =>
    ofProc(sink(port.agent[params.type].req), params)

  completeFlow = (port: this) =>
    mapToProc(source(port.agent.complete).pipe(take(1)), sink(port.complete))
}