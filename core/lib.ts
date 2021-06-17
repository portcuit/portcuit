import {values} from 'ramda'
import {Observable} from 'rxjs'

export class Socket<T> {
  source$!: Observable<T>
  sink!: Sink<T>
}

export type Sink<T> = {sink (value: T): PortMessage<T>}['sink']
export type PortMessage<T> = [string, T]


export const source = <T> (sock: {source$: Observable<T>}) =>
  sock.source$;

export const sink = <T> (sock: {sink: Sink<T>}) =>
  sock.sink;



export const isSocket = (sock: unknown): sock is Socket<any> =>
  sock instanceof Socket


export const tuple = <T extends any[]> (...args: T) =>
  args;

export class PkitError extends Error {
  constructor (message?: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = new.target.name
  }
}

// Deprecated from here

export interface PrivateSocket<T> extends Socket<T> {source$: never; sink: never;}
export const PrivateSocket = {
  PrivateSocket: (function () { } as unknown) as {new <T>(): PrivateSocket<T>}
}['PrivateSocket'];
PrivateSocket.prototype = Object.create(Socket.prototype);
Object.defineProperty(PrivateSocket.prototype, 'constructor', {
  value: PrivateSocket,
  enumerable: false,
  writable: true
});

export interface PrivateSinkSocket<T> extends Socket<T> {sink: never;}
export const PrivateSinkSocket = {
  PrivateSinkSocket: (function () { } as unknown) as {new <T>(): PrivateSinkSocket<T>}
}['PrivateSinkSocket'];
PrivateSinkSocket.prototype = Object.create(Socket.prototype);
Object.defineProperty(PrivateSinkSocket.prototype, 'constructor', {
  value: PrivateSinkSocket,
  enumerable: false,
  writable: true
});

export interface PrivateSourceSocket<T> extends Socket<T> {source$: never}
export const PrivateSourceSocket = {
  PrivateSourceSocket: (function () { } as unknown) as {new <T>(): PrivateSourceSocket<T>}
}['PrivateSourceSocket'];
PrivateSourceSocket.prototype = Object.create(Socket.prototype);
Object.defineProperty(PrivateSourceSocket.prototype, 'constructor', {
  value: PrivateSourceSocket,
  enumerable: false,
  writable: true
});

export type SocketData<T> = T extends PrivateSocket<infer I> ? I :
  T extends PrivateSinkSocket<infer I> ? I :
  T extends PrivateSourceSocket<infer I> ? I :
  T extends Socket<infer I> ? I : never;


export type ForcePublicPort<T> =
  {
    [P in keyof T]:
    T[P] extends PrivateSocket<infer I> ? Socket<I> :
    T[P] extends PrivateSinkSocket<infer I> ? Socket<I> :
    T[P] extends PrivateSourceSocket<infer I> ? Socket<I> :
    T[P] extends Function ? T[P] :
    T[P] extends Sink<any> ? T[P] :
    ForcePublicPort<T[P]>
  }

export type IPort<T> = ForcePublicPort<Omit<T, 'flow'>>

export const sourceSinkMapSocket = (port: PortObject): [SourceMap, SinkMap] => {
  const sourceMap: [string, Observable<any>][] = [];
  const sinkMap: [string, Sink<any>][] = [];

  const walk = (port: any, paths: string[] = []) => {
    if (isSocket(port)) {
      const path = paths.join('.');
      sinkMap.push([path, port.sink]);
      sourceMap.push([path, port.source$]);
    } else {
      for (const [key, val] of Object.entries(port)) {
        walk(val, [...paths, key])
      }
    }
  }
  walk(port);

  return [new Map(sourceMap), new Map(sinkMap)];
}

export type PortObject = {[key: string]: Socket<any> | any}

export type SourceMap = ReadonlyMap<string, Observable<any>>;

export type SinkMap = ReadonlyMap<string, Sink<any>>;

export const sourceSinkMap = <T> (port: PortSourceOrSink<T>): [SourceMap, SinkMap] => {
  const sourceMap: [string, Observable<any>][] = [];
  const sinkMap: [string, Sink<any>][] = [];

  const walk = (port: any, paths: string[] = []) => {
    if (typeof port === 'function') {
      sinkMap.push([paths.join('.'), port])
    } else if (port.pipe && typeof port.pipe === 'function') {
      sourceMap.push([paths.join('.'), port])
    } else {
      for (const [key, val] of Object.entries(port)) {
        walk(val, [...paths, key])
      }
    }
  }
  walk(port);

  return [new Map(sourceMap), new Map(sinkMap)];
}

export type PortSourceOrSink<T> = {
  [P in keyof T]?: T[P] extends Socket<any> ?
  (T[P]['source$'] | T[P]['sink']) : PortSourceOrSink<T[P]>
}

export type MappedWrapObservable<T> = {[P in keyof T]: Observable<T[P]>}

type AtLeastOneArray<T> = [T, ...unknown[]]
type AtLeastTwoArray<T> = [unknown, T, ...unknown[]]
type AtLeastThreeArray<T> = [T, T, T, ...T[]]

export const firstArgsFirstElm = <T> ([value]: AtLeastOneArray<T>) =>
  value

export const isTruthy = <T> (arg: T, ...args: any[]): boolean =>
  !!arg

export const firstElm = <T> (data: AtLeastOneArray<T> | T[] | readonly T[]) =>
  data[0]

export const secondElm = <T> (data: AtLeastTwoArray<T>) =>
  data[1]

export const firstElmsFirstElm = <T> ([[value]]: AtLeastOneArray<AtLeastOneArray<T>>) =>
  value

export const firstElmsSecondElm = <T> ([[, value]]: AtLeastOneArray<AtLeastTwoArray<T>>) =>
  value
