import {Observable, GroupedObservable, Subject} from "rxjs";
import {map, switchMap, filter} from "rxjs/operators";
import {PortMessage, PortObject, isSocket} from "../core/";

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

