import {merge, of} from "rxjs";
import {scan, switchMap} from "rxjs/operators";
import {source, sink, Socket} from 'pkit/core'
import {directProc} from "pkit/processors";
import {patch, StatePatch} from './processors'

export * from './processors'

export class StatePort<T> {
  init = new Socket<T>();
  update = new Socket<StatePatch<T>>();
  data = new Socket<T>();

  circuit (port: StatePort<T>) {
    return stateKit<T>(port);
  }
}

const stateKit = <T>(port: StatePort<T>) =>
  directProc(source(port.init).pipe(
    switchMap((initial) =>
      merge(
        source(port.update).pipe(
          scan((acc, curr) =>
            patch(curr, JSON.parse(JSON.stringify(acc))), initial)),
        of(initial)
      ))),
    sink(port.data))
