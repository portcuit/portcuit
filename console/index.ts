import {EventEmitter} from "events";
import minimatch from 'minimatch'
import chalk from "chalk";
import {LifecyclePort, mapProc, mergeMapProc, PortMessage, sink, Socket, source, StatePort, PortParams} from "@pkit/core";
import {fromEvent, merge, Observable, of} from "rxjs";
import {filter, tap, withLatestFrom} from "rxjs/operators";

export class ConsolePort extends LifecyclePort {
  init = new Socket<{
    emitter: EventEmitter;
    createLogger: (prefix: string) => typeof console.debug
  } & ConsolePort.Filter['console']>();
  state = new StatePort<ConsolePort.Filter['console']>();
  include = new Socket<string[]>();
  exclude = new Socket<string[]>();
}

export const consoleKit = (port: ConsolePort) =>
  merge(
    port.state.circuit(),

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

export const consoleInitOrDefault = (port: any): Observable<PortParams<ConsolePort>> =>
  port?.console?.init ?
    source<PortParams<ConsolePort>>(port.console.init) :
    of({
      emitter: new EventEmitter,
      include: [] as string[],
      exclude: [] as string[],
      createLogger: () => () => null
    })

export namespace ConsolePort {
  export type Filter = {
    console: {
      include: string[];
      exclude: string[];
    }
  };
}
