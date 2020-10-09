import 'source-map-support/register'
import util from 'util'
import {resolve} from 'path'
import {EventEmitter} from "events";
import {LifecyclePort, RootCircuit, entry, mount, Portcuit} from 'pkit'
import {parentPort, workerData, isMainThread} from 'worker_threads'

util.inspect.defaultOptions.depth = 1
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
  subject$.next(['console.init', {emitter, include: ['**/*'], exclude: [], createLogger}])
  return subject$;
}

if (workerData && workerData.src) {
  run(workerData.src, workerData.params)
}

