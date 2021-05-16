import {Observable, GroupedObservable, Subject} from "rxjs";
import {map, mergeMap, startWith, take, switchMap, filter, share} from "rxjs/operators";
import {Sink, PortMessage, PortObject, isSocket} from "../core/";

// It needs to have being started for restarting.
export const restartProc = (restart$: Observable<void>, stopped$: Observable<void>, started$: Observable<void>,
                            stopSink: Sink<void>, restartingSink: Sink<boolean>, startSink: Sink<void>, restartedSink: Sink<void>) =>
  restart$.pipe(
    mergeMap(() =>
      stopped$.pipe(
        take(1),
        mergeMap(() =>
          started$.pipe(
            take(1),
            map(() =>
              restartedSink()),
            startWith(startSink(), restartingSink(false)))),
        startWith(stopSink(), restartingSink(true)))));

export const inject = <T extends PortObject>(port: T, group$: Observable<GroupedObservable<string, any>>, subject$: Subject<PortMessage<any>>, namespace: string, except: any) => {
  const walk = (port: PortObject, ns: string[]=[]) => {
    for (const [key, sock] of Object.entries(port) ) {
      if (sock instanceof except) {

      } else if (isSocket(sock)) {
        const portPath = ns.concat(key);
        const portType = portPath.join('.');
        const source$ = group$.pipe(
          filter(({key}) =>
            key === portType),
          switchMap((stream$) =>
            stream$),
          map(([,portValue]) =>
            portValue));
        const sink = <T>(value?: T) => {
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

        // Object.assign(sock, {source$, sink});
      } else if (typeof sock !== 'function') {
        port[key] = walk(sock, ns.concat(key));
      }
    }
    return port
  };
  return walk(port) as T;
};

