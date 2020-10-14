import {identity, isEmpty} from 'ramda'
import {Observable, Subject, GroupedObservable, merge, of} from 'rxjs'
import {filter, map, switchMap, share, groupBy, tap} from 'rxjs/operators'
import type {LifecyclePort} from './'

export type Socket<T> = {
  source$: Observable<T>;
  sink: Sink<T>;
} & WritableSocket<T> & ReadableSocket<T>

export const Socket = (function (this: any) {
  this.source$ = undefined;
  this.sink = undefined;
} as unknown) as {new<T>(): Socket<T>}

export class ReadableSocket<T> {
  public readonly source$!: Observable<T>;
  protected readonly sink!: Sink<T>;
  getSink () {
    return this.sink;
  }
}

export class WritableSocket<T> {
  protected readonly source$!: Observable<T>;
  public readonly sink!: Sink<T>;
  getSource () {
    return this.source$;
  }
}

export type Sink<T> = (value?: T) => PortMessage<T>

export type PortMessage<T> = [string, T]

export const source = <T>(sock: Socket<T> | ReadableSocket<T>) =>
  sock.source$;

export const sink = <T>(sock: Socket<T> | WritableSocket<T>) =>
  sock.sink;

export type RootCircuit<U> = (port: U) => Observable<PortMessage<any>>
export type InferParams<T> = T extends { init: {source$: Observable<infer I>} } ? I : never;

export type PortcuitDefinition<T extends LifecyclePort> = {
  Port: new(...args: any) => T,
  circuit: RootCircuit<T>
}

export type Portcuit<T extends LifecyclePort> =
  PortcuitDefinition<T> & {
    params: InferParams<T>
  }

export const defaultLogger = globalThis?.process?.env?.NODE_ENV === 'production' ? () => null : console.debug;
export const entry = <T>(port: T, circuit: RootCircuit<T>, params: InferParams<T>,
  logger = defaultLogger) => {

  const subject$ = new Subject<PortMessage<any>>(),
    source$ = subject$.asObservable(),
    group$ = source$.pipe(groupBy(([portType]) =>
      portType)),
    stream$ = merge(
      circuit(inject(port, group$)),
      of(tuple('init', params)));

  stream$.pipe(tap(([type, data]) =>
    setTimeout(() =>
      logger(type, data))
  )).subscribe(subject$);

  return subject$
};

export const mount = <T extends LifecyclePort>({Port, circuit, params}: Portcuit<T>, logger = defaultLogger) =>
  entry(new Port, circuit, params, logger)

export const terminatedComplete = <T extends PortMessage<any>>(subject$: Subject<T>) =>
  subject$.pipe(tap(([type]) =>
    type === 'terminated' && subject$.complete()))

const isSocket = (sock: unknown): sock is Socket<any> =>
  sock instanceof Socket || sock instanceof ReadableSocket || sock instanceof WritableSocket

type PortObject = {
  [key: string]: Socket<any> | any
}

const inject = <T extends PortObject>(port: T, group$: Observable<GroupedObservable<string, any>>) => {
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
        Object.assign(sock, {source$, sink});
      } else if (typeof sock !== 'function') {
        port[key] = walk(sock, ns.concat(key));
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

export type PortSource<T> = {
  [P in keyof T]?: T[P] extends Socket<any> ? T[P]['source$'] : PortSource<T[P]>
}

export type PortSink<T> = {
  [P in keyof T]?: T[P] extends Socket<any> ? T[P]['sink'] : PortSink<T[P]>
}

export type PortSourceOrSink<T> = {
  [P in keyof T]?: T[P] extends Socket<any> ?
    (T[P]['source$'] | T[P]['sink']) : PortSourceOrSink<T[P]>
}

export type SocketData<T> = T extends Socket<infer I> ? I : never;

export type PortData<T> = {
  [P in keyof T]?: T[P] extends Socket<infer I> ? I : PortData<T[P]>
}

export type SourceMap = ReadonlyMap<string, Observable<any>>;
export type SinkMap = ReadonlyMap<string, Sink<any>>;

export const sourceSinkMapSocket = (port: PortObject): [SourceMap, SinkMap] => {
  const sourceMap: [string, Observable<any>][] = [];
  const sinkMap: [string, Sink<any>][] = [];

  const walk = (port: any, paths: string[]=[]) => {
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

export type InferSinkObservable<T> = T extends Socket<infer I> ? Observable<PortMessage<I>> : never;