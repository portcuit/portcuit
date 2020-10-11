import {EventEmitter} from "events";
import minimatch from 'minimatch'
import chalk from "chalk";
import {LifecyclePort, mergeMapProc, PortMessage, sink, Socket, source} from "pkit";
import {fromEvent, merge, Observable, of} from "rxjs";
import {filter, startWith, tap, withLatestFrom} from "rxjs/operators";

export type ConsoleParams = {
  emitter: EventEmitter;
  include: string[];
  exclude: string[];
  createLogger: (prefix: string) => typeof console.debug
}

export class ConsolePort extends LifecyclePort<ConsoleParams> {
  include = new Socket<string[]>();
  exclude = new Socket<string[]>();
}

export const consoleKit = (port: ConsolePort) =>
  merge(
    mergeMapProc(source(port.init), sink(port.debug),
      ({emitter, include, exclude}) =>
        fromEvent<PortMessage<any>>(emitter, 'debug').pipe(
          withLatestFrom(
            source(port.include).pipe(startWith(include)),
            source(port.exclude).pipe(startWith(exclude))),
          tap(([[type, data],include, exclude]) =>
            include.some((ptn) =>
              minimatch(type, ptn)) &&
            !exclude.some((ptn) =>
              minimatch(type, ptn)) &&
            console.debug(chalk.bgBlackBright.bold(type), data)),
          filter(() =>
            false))),
  )

export const consoleInitOrDefault = (port: any): Observable<ConsoleParams> =>
  port?.console?.init ?
    source<ConsoleParams>(port.console.init) :
    of({
      emitter: new EventEmitter,
      include: [] as string[],
      exclude: [] as string[],
      createLogger: () => () => null
    })
