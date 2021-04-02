import {Socket} from './processors'
import {EncodedPatch, Patch} from "@pkit/core";

export * from './processors'

export class EndpointPort<T, U, V = Error> {
  req = new Socket<T>();
  res = new Socket<U>();
  err = new Socket<V>();
}

export class PatchPort<T> {
  encode = new Socket<Patch<T>>();
  decode = new Socket<EncodedPatch>();
}