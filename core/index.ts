import {Socket} from './processors'

export * from './processors'

export class LifecyclePort<T=any> {
  init = new Socket<T>();
  ready = new Socket<any>();
  terminate = new Socket<any>();
  terminated = new Socket<any>();
  quit = new Socket<any>();
  info = new Socket<any>();
  debug = new Socket<any>();
  running = new Socket<boolean>();
  err = new Socket<Error>();
  _ns?: string[]
}

export class EndpointPort<T, U, V = Error> {
  req = new Socket<T>();
  res = new Socket<U>();
  err = new Socket<V>();
}
