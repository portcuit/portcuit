import {PortData, Socket} from './processors'

export * from './processors'

export class LifecyclePort<T=any> {
  init = new Socket<T>();
  ready = new Socket<PortData>();
  terminate = new Socket<PortData>();
  terminated = new Socket<PortData>();
  quit = new Socket<PortData>();
  info = new Socket<PortData>();
  debug = new Socket<PortData>();
  running = new Socket<boolean>();
  err = new Socket<Error>();
  _ns?: string[]
}

export class DataPort<T> {
  data = new Socket<T>();
}

export type MappedWrapDataPort<T> = {[P in keyof T]: DataPort<T[P]>}

export class EndpointPort<T, U, V = Error> {
  req = new Socket<T>();
  res = new Socket<U>();
  err = new Socket<V>();
}
