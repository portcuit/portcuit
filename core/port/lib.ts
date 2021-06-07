import {Observable, GroupedObservable, Subject, merge} from "rxjs";
import {map, switchMap, filter, takeUntil} from "rxjs/operators";
import {PortMessage, PortObject, isSocket, Socket, source, SocketData} from "../lib";

export const inject = <T extends PortObject> (port: T, group$: Observable<GroupedObservable<string, any>>, subject$: Subject<PortMessage<any>>, namespace: string) => {
  const walk = (port: PortObject, ns: string[] = []) => {
    for (const [key, sock] of Object.entries(port)) {
      if (isSocket(sock)) {
        const portPath = ns.concat(key);
        const portType = portPath.join('.');
        const source$ = group$.pipe(
          filter(({key}) =>
            key === portType),
          switchMap((stream$) =>
            stream$),
          map(([, portValue]) =>
            portValue));
        const sink = <T> (value?: T) => {
          setImmediate(() =>
            subject$.next([portType, value]));
          return [`${namespace}${portType}`, value];
        }

        if (sock['source$'] === undefined) {
          Object.assign(sock, {source$});
        }
        if (sock['sink'] === undefined) {
          Object.assign(sock, {sink});
        }
      } else if (typeof sock !== 'function') {
        port[key] = walk(sock, ns.concat(key));
      }
    }
    return port
  };
  return walk(port) as T;
};


export class Container<T = {}> {
  constructor (port: T = {} as T) {
    Object.assign(this, port)
  }
}

type InferContainer<T> = T extends Container<infer I> ? I : never;
type Entry<T> = [keyof T, T[keyof T]]
export namespace Container {
  export const entries = <T> (obj: T): Entry<T & InferContainer<T>>[] => {
    const entries = [] as Entry<T & InferContainer<T>>[]
    for (const key in obj) {
      entries.push([key, obj[key]] as any)
    }
    return entries
  }
}

export const cycleFlow = <
  P extends {[A in T | U]: Socket<any>},
  T extends string,
  U extends string,
  V extends {[label: string]: {(port: P, params: SocketData<P[T]>): Observable<PortMessage<any>>}}>
  (port: P, start: T, stop: U, flows: V, override = true, target: V = port as any) =>
  source(port[start]).pipe(
    switchMap((params) => merge(
      ...Object.entries(flows).map(([name, fn]) =>
        (override && target[name] ? target[name] : fn)(port, params))
    ).pipe(takeUntil(source(port[stop])))))

export type IFlow<T extends {init: Socket<any>}> = {
  (port: T, params: PortParams<T>): Observable<PortMessage<any>>
}


export type PortParams<T> = T extends {init: Socket<infer I>} ? I : never

export type DeepPartialPort<T> = {[P in keyof T]?: DeepPartialPort<T[P]>}

export type InjectPort<T, U extends keyof T> = DeepPartialPort<Omit<T, U>> & Pick<T, U>;
