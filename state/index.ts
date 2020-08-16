import {source, sink, Socket, DeepPartial} from 'pkit/core'
import {initProc} from './processors'

export * from './processors'

export class StatePort<T> {
  raw = new Socket<DeepPartial<T>>();
  init = new Socket<DeepPartial<T>>();
  patch = new Socket<DeepPartial<T>>();
  data = new Socket<T>();
}

export type Compute<T> = (state: DeepPartial<T>) => T;
const defaultCompute = <T>(state: DeepPartial<T>) => state as T;

export const stateKit = <T>(port: StatePort<T>, compute: Compute<T> = defaultCompute) =>
  initProc(source(port.init), source(port.patch), sink(port.raw), sink(port.data), compute);
