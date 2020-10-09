import {EventEmitter} from "events";
import minimatch from 'minimatch'
import {directProc, LifecyclePort, PortMessage, sink, Socket, source} from "pkit";
import {combineLatest, fromEvent, merge, of} from "rxjs";
import {filter, mergeMap, switchMap, tap} from "rxjs/operators";

export type ConsoleParams = {
  emitter: EventEmitter;
  include: string[];
  exclude: string[];
  createLogger: (prefix: string) => typeof console.debug
}

export class ConsolePort extends LifecyclePort<ConsoleParams> {
  emitter = new Socket<EventEmitter>();
  include = new Socket<string[]>();
  exclude = new Socket<string[]>();
}

export const consoleKit = (port: ConsolePort) =>
  merge(
    // ネストしたPortcuitのために
    directProc(of({
      emitter: new EventEmitter,
      include: [] as string[],
      exclude: [] as string[],
      createLogger: () => () => null
    }), sink(port.init)),

    combineLatest(source(port.emitter),
      source(port.include),
      source(port.exclude)).pipe(
      switchMap(([emitter, include, exclude]) =>
        fromEvent<PortMessage<any>>(emitter, 'debug').pipe(
          tap(([type, data]) => {
            if (include.some((ptn) =>
                minimatch(type, ptn)) &&
              !exclude.some((ptn) =>
                minimatch(type, ptn))) {
              console.debug(type, data);
            }
          }),
          filter(() =>
            false)))),

    source(port.init).pipe(
      mergeMap(({emitter, include, exclude}) =>
        of(sink(port.emitter)(emitter),
          sink(port.include)(include),
          sink(port.exclude)(exclude)))),
  )