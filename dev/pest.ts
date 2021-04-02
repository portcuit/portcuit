#!/usr/bin/env node

import 'source-map-support/register';
import util from 'util';
import {resolve} from 'path'
import {from} from 'rxjs'
import {concatMap} from "rxjs/operators";
import {config} from 'dotenv'

config();

util.inspect.defaultOptions.depth = 1;
util.inspect.defaultOptions.breakLength = Infinity

const tests: Array<{fn: () => Promise<any>, label: string}> = []

Object.assign(globalThis, {
  test: (label: string, fn: () => any) =>
    tests.push({label, fn}),
  xtest: (label: string, fn: () => any) =>
    console.log(`\n### through ${label}`)
})

await import(resolve(process.argv[2]));

await from(tests).pipe(concatMap(({fn, label}) => {
  console.log(`\n##### ${label} #####`);
  return fn();
})).toPromise()
