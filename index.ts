import {EventEmitter} from "events";
import minimatch from 'minimatch'
import chalk from "chalk";
import {LifecyclePort, mapProc, mergeMapProc, PortMessage, sink, Socket, source, StatePort} from "pkit";
import {fromEvent, merge, Observable, of} from "rxjs";
import {filter, startWith, tap, withLatestFrom} from "rxjs/operators";

type ConsoleFilter = {
  include: string[];
  exclude: string[];
}

export type ConsoleParams = {
  emitter: EventEmitter;
  createLogger: (prefix: string) => typeof console.debug
} & ConsoleFilter;

export class ConsolePort extends LifecyclePort<ConsoleParams> {
  state = new StatePort<ConsoleFilter>();
  include = new Socket<string[]>();
  exclude = new Socket<string[]>();
}

export const consoleKit = (port: ConsolePort) =>
  merge(
    StatePort.prototype.circuit(port.state),

    mergeMapProc(source(port.init), sink(port.debug),
      ({emitter, include, exclude}) =>
        fromEvent<PortMessage<any>>(emitter, 'debug').pipe(
          withLatestFrom(source(port.state.data)),
          tap(([[type, data], {include, exclude}]) =>
            include.some((ptn) =>
              minimatch(type, ptn)) &&
            !exclude.some((ptn) =>
              minimatch(type, ptn)) &&
            console.debug(chalk.bgBlackBright.bold(type), data)),
          filter(() =>
            false))),

    mapProc(source(port.init), sink(port.state.init), ({include, exclude}) =>
      ({include, exclude})),
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
