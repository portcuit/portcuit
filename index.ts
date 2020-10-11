import 'source-map-support/register'
import util from 'util'
import {resolve} from 'path'
import {EventEmitter} from "events";
import {Worker, parentPort, workerData, isMainThread} from 'worker_threads'
import {entry, LifecyclePort, Portcuit, PortMessage, source} from 'pkit'
import {consoleKit, ConsolePort} from "@pkit/console";
import {fromEvent, merge, Observable} from "rxjs";
import {filter, map, mergeMap, switchMap} from "rxjs/operators";
import {DevWorkerRunPort, devWorkerRunKit} from './worker'

if (!isMainThread) {
  process.stdout.isTTY = process.stderr.isTTY = process.stdin.isTTY = true;
}

util.inspect.defaultOptions.depth = parseInt(process.env.depth || '1', 10);
util.inspect.defaultOptions.breakLength = Infinity

export interface IDevPort extends LifecyclePort {
  console: ConsolePort;
}

const createDevPort = <T extends new(...args: any[]) => {}>(ctor: T) =>
  class DevPort extends ctor {
    console = new ConsolePort;
  }

const createDevKit = <T extends IDevPort>(circuit: (port: T) => Observable<PortMessage<any>>) =>
  (port: T) =>
    merge(
      circuit(port),
      consoleKit(port.console),
      source(port.init).pipe(
        filter(() =>
          !isMainThread),
        switchMap(() =>
          fromEvent<MessageEvent<PortMessage<any>>>(parentPort as any, 'message').pipe(
            map(({data}) =>
              data))))
    )

const emitter = new EventEmitter;

const createLogger = (prefix: string = '') =>
  (type: string, data: any) =>
    emitter.emit('debug', [`${prefix}${type}`, data])

const consoleParams = {
  emitter,
  include: process.env.include ?
    process.env.include.split(',') :
    ['**/*'],
  exclude: process.env.exclude ?
    process.env.exclude.split(',') :
    [],
  createLogger
}

export const run_worker = (src: string, params?: any) => {
  const subject$ = entry(new DevWorkerRunPort, devWorkerRunKit, {worker:{ctor: Worker}, workerData: {src, params}} as any,
    createLogger('/top/'));
  // const watch: string = 'server/*.js'
  // const subject$ = entry(new DevWorkerRunPort, devWorkerRunKit, {worker:{ctor: Worker},workerData:{src, params}, watch} as any, createLogger('/top/'));
  subject$.subscribe({error: console.error});
  subject$.next(['console.init', consoleParams]);
  return subject$;
}

export const run = (src: string, params?: any) => {
  const mode = require(src.startsWith('./') ? resolve(src) : src);
  const portcuit: Portcuit<LifecyclePort> = mode.portcuit || mode.default;
  if (!portcuit) {
    throw new Error(`portcuit is undefined: ${src}`);
  }
  const subject$ = entry(new (createDevPort(portcuit.Port)), createDevKit(portcuit.circuit), params || portcuit.params,
    createLogger('/dev/'));
  subject$.subscribe({error: console.error});
  subject$.next(['console.init', consoleParams]);
  return subject$;
}

if (workerData && workerData.src) {
  run(workerData.src, workerData.params)
}