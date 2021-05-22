import {Socket} from './processors'

export * from './processors'

export class EndpointPort<T, U, V = Error> {
  req = new Socket<T>();
  res = new Socket<U>();
  err = new Socket<V>();
}
