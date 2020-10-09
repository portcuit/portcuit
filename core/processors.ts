import {identity, is, isEmpty} from 'ramda'
import {Observable, Subject, GroupedObservable, merge, of} from 'rxjs'
import {filter, map, switchMap, share, groupBy, tap} from 'rxjs/operators'
import type {LifecyclePort} from './'

export class Socket<T> {
  source$!: Observable<T>;
  sink!: Sink<T>;
  path!: any[];
}

export type PortSource<T> = {
  [P in keyof T]?: T[P] extends Socket<any> ? T[P]['source$'] : PortSource<T[P]>
}

export type PortSink<T> = {
  [P in keyof T]?: T[P] extends Socket<any> ? T[P]['sink'] : PortSink<T[P]>
}

export type PortSourceOrSink<T> = {
  [P in keyof T]?: T[P] extends Socket<any> ? (T[P]['source$'] | T[P]['sink']) : PortSourceOrSink<T[P]>
}

export type PortData<T> = {
  [P in keyof T]?: T[P] extends Socket<infer I> ? I : PortData<T[P]>
}

export type SourceMap = ReadonlyMap<string, Observable<any>>;
export type SinkMap = ReadonlyMap<string, Sink<any>>;

export const sourceSinkMap = <T>(port: PortSourceOrSink<T>): [SourceMap, SinkMap] => {
  const sourceMap: [string, Observable<any>][] = [];
  const sinkMap: [string, Sink<any>][] = [];

  const walk = (port: any, paths: string[]=[]) => {
    if ( typeof port === 'function' ) {
      sinkMap.push([paths.join('.'), port])
    } else if( port.pipe && typeof port.pipe === 'function' ) {
      sourceMap.push([paths.join('.'), port])
    } else {
      for ( const [key, val] of Object.entries(port) ) {
        walk(val, [...paths, key])
      }
    }
  }
  walk(port);

  return [new Map(sourceMap), new Map(sinkMap)];
}

type Nested<T> = {
  [P in number | string]?:
  | T
  | { [P in number | string]?: T }
  | { [P in number | string]?: { [P in number | string]?: T }}
  | { [P in number | string]?: { [P in number | string]?: { [P in number | string]?: T }}}
}

export type PortMessage<T> = [string, T]

export type Sink<T> = (value?: T) => PortMessage<T>

export type SourceSink = [Observable<any>, Sink<any>]

export type SocketData<T> = T extends Socket<infer I> ? I : never;

export const source = <T>(sock: Socket<T>) =>
  sock.source$;

export const sink = <T>(sock: Socket<T>) =>
  sock.sink;

export const portPath = (port: Socket<any> | LifecyclePort) =>
  (port instanceof Socket) ? port.path : port._ns as string[];

export type InferParams<T> = T extends LifecyclePort<infer U>  ? U : never;

export type Portcuit<T extends LifecyclePort> = {
  Port: new(...args: any) => T,
  circuit: RootCircuit<T>,
  params?: InferParams<T>
}

export type RootCircuit<T> = (port: T) => Observable<PortMessage<any>>

export const entry = <T, U extends LifecyclePort<T>>(port: U, circuit: RootCircuit<U>, params: T, logger = console.debug) => {
  const subject$ = new Subject<PortMessage<any>>(),
    source$ = subject$.asObservable(),
    group$ = source$.pipe(groupBy(([portType]) =>
      portType)),
    stream$ = merge(
      circuit(inject(port, group$)),
      of(['init', params] as PortMessage<T>));

  stream$.pipe(tap((args) =>
    logger(...args))).subscribe(subject$);

  return subject$
};

export const mount = <T, U extends LifecyclePort<T>, V extends new() => U>(
  {Port, circuit, params}: {Port: V, circuit: RootCircuit<U>, params: T}, logger = console.debug) =>
  entry(new Port, circuit, params, logger)

export const terminatedComplete = <T extends PortMessage<any>>(subject$: Subject<T>) =>
  subject$.pipe(tap(([type]) =>
    type === 'terminated' && subject$.complete()))

const isSocket = (sock: unknown): sock is Socket<any> =>
  sock instanceof Socket

type PortObject = {
  [key: string]: any
}

const inject = <T extends LifecyclePort>(port: PortObject, group$: Observable<GroupedObservable<string, any>>) => {
  const walk = (port: PortObject, ns: string[]=[]) => {
    for (const [key, sock] of Object.entries(port) ) {
      if (isSocket(sock)) {
        const portPath = ns.concat(key);
        const portType = portPath.join('.');
        const source$ = group$.pipe(
          filter(({key}) =>
            key === portType),
          switchMap(identity),
          map(([,portValue]) =>
            portValue),
          share());
        const sink = <T>(value?: T) =>
          [portType, value] as PortMessage<T>;
        Object.assign(sock, {source$, sink, path: portPath});
      } else if (key !== '_ns') {
        port[key] = walk(sock, ns.concat(key));
        if ( is(Object, sock) && !sock['_ns'] ) {
          Object.defineProperty(sock, '_ns', {
            value: ns.concat(key),
            writable: false
          })
          // sock['_ns'] = ns.concat(key);
        }
      }
    }
    return port
  };
  return walk(port) as T;
};

export namespace Pkit {
  export class Error extends globalThis.Error {
    public constructor(message: string) {
      super();
      Object.defineProperty(this, 'name', {
        get: () => (this.constructor as any).name,
      });
      Object.defineProperty(this, 'message', {
        get: () => message,
      });
      globalThis.Error.captureStackTrace(this, this.constructor);
    }
  }

  export class EventError extends Error {
    constructor(public error: Event) {
      super(JSON.stringify(error));
    }
  }
}

// export type DeepPartial<T> = T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T[P] extends ReadonlyArray<infer U>
      ? ReadonlyArray<DeepPartial<U>>
      : T[P] extends Object
        ? DeepPartial<T[P]> : T[P]
};


export type Ns<T extends {}> = T

export type NsPath = string[]

export const ns2path = <T>(ns: Ns<DeepPartial<T>>): string[][] => {
  const products: any[] = [];

  const walk = (ns: any, path: any[]=[]): any => {
    if (ns === null || isEmpty(ns)) {
      products.push(path);
      return;
    } else {
// TODO: 配列型にも対応!!
      return Object.entries(ns).map(([key, val]) =>
        walk(val, path.concat(key)));
    }
  };
  walk(ns);

  return products;
};

export type MappedWrapObservable<T> = {[P in keyof T]: Observable<T[P]>}
export type MappedWrapSocket<T> = {[P in keyof T]: Socket<T[P]>}

export const throwErrorIfUndefined = <T>(data: T): T => {
  if(data === undefined) {
    throw new Error('data is undefined');
  }
  return data;
}

export const tuple = <T extends any[]>(...args: T) =>
  args;

export type InferPortMessageFromSocket<T> = T extends Socket<infer I> ? PortMessage<I> : never;

export type InferSinkObservable<T> = T extends Socket<infer I> ? Observable<PortMessage<I>> : never;