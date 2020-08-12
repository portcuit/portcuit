import {source, sink, Socket, DeepPartial, PickIFromAnd} from 'pkit/core'
import {initProc, Replace} from './processors'

export * from './processors'

export class StatePort<T> {
  raw = new Socket<PickIFromAnd<T>>();
  init = new Socket<PickIFromAnd<T>>();
  patch = new Socket<DeepPartial<T>>();
  replace = new Socket<Replace<T>>();
  data = new Socket<T>();
}

export type Compute<T> = (state: DeepPartial<T>, plan?: DeepPartial<PickIFromAnd<T>>) => DeepPartial<T>
const defaultCompute = <T>(state: T) => state;

export const stateKit = <T, U extends T>(port: StatePort<T>, compute: Compute<T> = defaultCompute as Compute<T>) =>
  initProc(source(port.init), source(port.patch), source(port.replace), sink(port.raw), sink(port.data), sink(port.patch), compute);