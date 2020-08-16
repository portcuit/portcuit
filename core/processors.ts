import minimatch from 'minimatch'
import {identity, is, isEmpty} from 'ramda'
import {Observable, Subject, GroupedObservable, merge} from 'rxjs'
import {filter, map, switchMap, share, groupBy, takeWhile, tap} from 'rxjs/operators'
import type {LifecyclePort} from './'

export class Socket<T> {
  source$!: Observable<T>;
  sink!: Sink<T>;
  path!: any[];
}

type Nested<T> = {
  [P in number | string]?:
  | T
  | { [P in number | string]?: T }
  | { [P in number | string]?: { [P in number | string]?: T }}
  | { [P in number | string]?: { [P in number | string]?: { [P in number | string]?: T }}}
}

export type PortData = any
export type PortMessage<T extends PortData> = [string, T]

const portSink = <T>(data: PortSink<T>) => data
export type PortSink<T> = {
  [P in keyof T]? : T[P] extends Socket<infer I> ? I : PortSink<T[P]>
}

export type Sink<T> = (value?: T) => PortMessage<T>

export type SourceSink = [Observable<any>, Sink<any>]

export type UnwrapSocket<T> = T extends Socket<infer I> ? I : never;

export const source = <T>(sock: Socket<T>) =>
  sock.source$;

export const sink = <T>(sock: Socket<T>) =>
  sock.sink;

export const portPath = (port: Socket<any> | LifecyclePort) =>
  (port instanceof Socket) ? port.path : port._ns as string[];

const formatNow = (ts: number) => {
  const min = Math.floor(ts / (60 * 1000));
  const sec = Math.floor(ts / 1000) % 60;
  const msec = ts % 1000;
  return `${min.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}.${msec.toString().padStart(3,'0')}`;
}

type RootCircuit<T extends LifecyclePort> = (port: T, opts?: any) => Observable<PortMessage<PortData>>
export const run = <T extends LifecyclePort>(port: T, circuit: RootCircuit<T>, opts?: any) => {
  const subject$ = new Subject<PortMessage<PortData>>(),
    source$ = subject$.asObservable(),
    group$ = source$.pipe(groupBy(([portType]) =>
      portType)),
    stream$ = circuit(inject(port, group$), opts);

  // @ts-ignore
  subject$.exclude = []; subject$.include = globalThis?.process?.env?.NODE_DEBUG === 'production' ? [] : ['*'];

  const start = (new Date).getTime();
  stream$.pipe(
    tap(([type, data]) => {
      const {include, exclude}: {include: string[], exclude: string[]} = subject$ as any;
      if (include.some((ptn) => minimatch(type, ptn)) &&
        !exclude.some((ptn) => minimatch(type, ptn))) {
        console.debug(`[${formatNow((new Date).getTime() - start)}] ${type}`, data)
      }
    })).subscribe(subject$);

  return subject$
};

const isSocket = (sock: unknown): sock is Socket<any> =>
  sock instanceof Socket

type PortObject = {
  [key: string]: any
}

const inject = <T extends LifecyclePort>(port: PortObject, group$: Observable<GroupedObservable<string, PortData>>) => {
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
      } else {
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

const isObject = (val: any): val is Object =>
  val !== null && val.constructor === Object || val instanceof Object;

export const isPureObject = (val: unknown) =>
  isObject(val) && val.constructor !== String;

// export const reversePath = (idxs, ...args) =>
//   (path as any)(idxs.reverse(), ...args);

export class PCError extends Error {
  public constructor(message: string) {
    super();
    Object.defineProperty(this, 'name', {
      get: () => (this.constructor as any).name,
    });
    Object.defineProperty(this, 'message', {
      get: () => message,
    });
    Error.captureStackTrace(this, this.constructor);
  }
}

export class EventError extends PCError {
  constructor(public error: Event) {
    super(JSON.stringify(error));
  }
}

// export type DeepPartial<T> = T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T[P] extends ReadonlyArray<infer U>
      ? ReadonlyArray<DeepPartial<U>>
      : DeepPartial<T[P]>
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

export const splice = <T>(start: number, deleteCount=0, ...items: T[]): T[] =>
  Array(start).concat(Array(deleteCount).fill(undefined)).concat(...items);

export const throwErrorIfUndefined = <T>(data: T): T => {
  if(data === undefined) {
    throw new Error('data is undefined');
  }
  return data;
}