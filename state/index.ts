import {scan, startWith, switchMap} from "rxjs/operators";
import {source, sink, Socket, DeepPartial} from 'pkit/core'
import {directProc} from "pkit/processors";
import {patch, StatePatch} from './processors'

export * from './processors'

export class StatePort<T> {
  init = new Socket<T>();
  update = new Socket<StatePatch<T>>();
  patch = new Socket<StatePatch<T>>();
  data = new Socket<T>();

  circuit (port: StatePort<T>) {
    return stateKit<T>(port);
  }
}

// export type Compute<T> = (state: DeepPartial<T>) => T;
// const defaultCompute = <T>(state: DeepPartial<T>) => state as T;

const stateKit = <T>(port: StatePort<T>) =>
  directProc(source(port.init).pipe(
    switchMap((initial) =>
      source(port.update).pipe(
        scan((acc, curr) =>
          patch(curr, JSON.parse(JSON.stringify(acc))), initial),
        startWith(initial)))),
    sink(port.data))


// const stateKit = <T>(port: StatePort<T>, compute: Compute<T> = defaultCompute) =>
//   initProc(source(port.init), source(port.patch), sink(port.raw), sink(port.data), compute);
