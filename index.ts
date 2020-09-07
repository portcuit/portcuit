import 'source-map-support/register'
import util from 'util'
import {resolve} from 'path'
import {LifecyclePort, RootCircuit, entry, mount} from 'pkit'
import {parentPort, workerData} from 'worker_threads'

util.inspect.defaultOptions.depth = 1
util.inspect.defaultOptions.breakLength = Infinity

export * from './worker'

export const run = (src: string, overrideParams?: any) => {
  const args = require(src.startsWith('./') ? resolve(src) : src).default;
  const subject$ = mount(overrideParams ? [...args.slice(0,2), overrideParams] : args);
  subject$.subscribe({error: console.error})
  Object.assign({subject$})
}

if (workerData && workerData.src) {
  run(workerData.src, workerData.params)
}

