import {assocPath, dissocPath} from 'ramda'
import {Observable, merge, of} from 'rxjs'
import {scan, switchMap, map, startWith, mergeMap} from 'rxjs/operators'
import {Sink, DeepPartial, patch, PickIFromAnd, ns2path} from 'pkit/core'
import type {Compute} from './'

export type Replace<T> = {
  data: any;
  ns: DeepPartial<T>
}

export const initProc = <T>(
  init$: Observable<PickIFromAnd<T>>,
  patch$: Observable<DeepPartial<T>>,
  replace$: Observable<Replace<T>>,
  rawSink: Sink<PickIFromAnd<T>>,
  dataSink: Sink<T>,
  patchSink: Sink<DeepPartial<T>>,
  compute: Compute<T>) =>
  init$.pipe(
    switchMap((seed: any) =>
      merge(
        patch$.pipe(map((data) =>
          [data, 'patch'])),
        replace$.pipe(map((data) =>
          [data, 'replace']))).pipe(
        scan((acc: any, curr: any) => {
          const [obj, type] = curr;
          if (type === 'patch') {
            return patch(obj, acc);
          } else {
            const {data, ns} = obj;
            const path = ns2path(ns)[0];
            if (data !== undefined) {
              return assocPath(path, data, acc);
            } else {
              return dissocPath(path, acc);
            }
          }
        }, seed),
        mergeMap((data: any) =>
          of(
            rawSink(data),
            dataSink(compute(data) as T))),
        startWith(
          rawSink(seed),
          dataSink(compute(seed) as T)))));
