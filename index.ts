import 'source-map-support/register'
import util from 'util'
import {resolve} from 'path'
import {EventEmitter} from "events";
import {workerData, isMainThread} from 'worker_threads'
import {mount, Portcuit} from 'pkit'

util.inspect.defaultOptions.depth = parseInt(process.env.depth || '1', 10);
util.inspect.defaultOptions.breakLength = Infinity

export * from './worker'

export const run = (src: string, params?: any) => {
  const mods = require(src.startsWith('./') ? resolve(src) : src);
  const portcuit: Portcuit<any> = mods.portcuit || mods.default;
  if (!portcuit) {
    throw new Error(`portcuit is undefined: ${src}`);
  }

  const emitter = new EventEmitter;

  const createLogger = (prefix: string = '') =>
    (type: string, data: any) =>
      emitter.emit('debug', [`${prefix}${type}`, data])

  const subject$ = mount({
    Port: portcuit.Port,
    circuit:
    portcuit.circuit,
    params: params || portcuit.params
  }, createLogger(isMainThread ? '/top/' : '/worker/'));
  subject$.subscribe({error: console.error});

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

  subject$.next(['console.init', consoleParams])
  return subject$;
}

if (workerData && workerData.src) {
  run(workerData.src, workerData.params)
}