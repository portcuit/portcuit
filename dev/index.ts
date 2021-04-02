import 'source-map-support/register'
import util from 'util'
import {resolve} from 'path'
import {EventEmitter} from "events";
import {Worker, parentPort, workerData, isMainThread} from 'worker_threads'
import {fromEvent, merge, Observable} from "rxjs";
import {filter, map, switchMap} from "rxjs/operators";
import {LifecyclePort, PortMessage, source} from '@pkit/core'
import {consoleKit, ConsolePort} from "@pkit/console";
import {DevWorkerRunPort} from './worker'
import {config} from 'dotenv'

config();

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

const defaultConsoleParams = {
  emitter,
  include: ['**/*'],
  exclude: [],
  createLogger
}

// みたいな感じでpuppeteerはここで起動させた方が良さそうな気がする
// puppeteer終了（ページ閉じる）でプロセス終了
// export const run_worker_pptr

export const run_worker = (src: string, params?: any) => {
  const subject$ = new DevWorkerRunPort().stream({
    worker: {ctor: Worker},
    workerData: {src, params}
  } as any)

  // const watch: string = 'server/*.js'
  // const subject$ = entry(new DevWorkerRunPort, devWorkerRunKit, {worker:{ctor: Worker},workerData:{src, params}, watch} as any, createLogger('/top/'));

  const consoleParams = params?.console ? {...defaultConsoleParams, ...params.console} : defaultConsoleParams;
  // subject$.next(['console.init', consoleParams]);

  subject$.subscribe({complete: () => process.exit()});
  return subject$;
}

export const run = (src: string, params?: any) => {
  const {Port} = require(src.startsWith('./') ? resolve(src) : src);
  if (!(Port && Port.prototype.circuit)) {
    throw new Error(`portcuit is undefined: ${src}`);
  }
  params ??= Port.params

  const DevPort = createDevPort(Port);
  DevPort.prototype.circuit = createDevKit(Port.prototype.circuit)
  const subject$ = new DevPort().listen(params, createLogger('/app/'));

  const consoleParams = params?.console ? {...defaultConsoleParams, ...params.console} : defaultConsoleParams;
  subject$.next(['console.init', consoleParams]);

  subject$.subscribe({complete: () => process.exit()})
  return subject$;
}

if (workerData && workerData.src) {
  run(workerData.src, workerData.params)
}