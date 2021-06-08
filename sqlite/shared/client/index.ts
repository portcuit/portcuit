import {merge} from 'rxjs'
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

  clientFlow = (port: this, params: PortParams<this>) =>
    merge(
      ofProc(sink(port.agent[params.type].req), params),
      mapToProc(source(port.agent.complete).pipe(take(1)), sink(port.complete))
    )

  // flow () {
  //   return merge(
  //     source(this.init).pipe(
  //       switchMap((params) =>
  //         ofProc(sink(this.agent[params.type].req), params))),
  //     mapToProc(source(this.agent.complete).pipe(take(1)), sink(this.complete)),
  //   );
  // }
}