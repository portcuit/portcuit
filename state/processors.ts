import {Observable, of} from 'rxjs'
import {scan, switchMap, startWith, mergeMap} from 'rxjs/operators'
import {Sink} from 'pkit/core'
import type {Compute} from './'

export class PreserveArray<T> extends Array {
  constructor(...props: T[]) {
    // @ts-ignore
    super(...props);
  }
}

export class ReplaceArray<T> extends Array {
  constructor(...props: T[]) {
    // @ts-ignore
    super(...props);
  }
}

export class ReplaceObject<T> {
  constructor(data: T) {
    Object.assign(this, data);
  }
}

export class EphemeralBoolean extends Boolean {
  constructor(data: boolean) {
    super(data);
  }
  toJSON() {
    return undefined;
  }
}

export const patch = (
  plan: any,
  data: any) => {

  if (plan === null
    || plan === undefined
    || plan.constructor === Boolean
    || plan.constructor === String
    || plan.constructor === Number
    || plan.constructor === Array
    || plan.constructor === ReplaceArray
    || plan.constructor === ReplaceObject
  ) {
    return plan;
  } else if (plan.constructor === PreserveArray) {
    if (data.constructor !== Array) {
      throw Error('data is not Array.');
    }

    const items: [number, any][] = [];
    plan.forEach((value: any, index: number) =>
      items.unshift([index, value]));
    
    for (const [index, val] of items) {
      if (val === undefined) {
        data.splice(index, 1);
      } else if (data[index] === undefined) {
        data[index] = val;
      } else {
        const i = data.length < index ? data.length : index;
        data[i] = patch(val, data[index]);
      }
    }

    return data;
  } else {
    if (data === null
      || data === undefined
      || data.constructor === Boolean
      || data.constructor === String
      || data.constructor === Number
      || data.constructor === Array
    ) {
      throw Error('data is not Object');
    }
    
    for (const [key, value] of Object.entries(plan)) {
      if (data[key] === undefined) {
        data[key] = value;
      } else {
        data[key] = patch(value, data[key]);
      }
    }

    return data;
  }
};

export const initProc = <T, U>(init$: Observable<U>,
                             patch$: Observable<U>,
                             rawSink: Sink<U>,
                             dataSink: Sink<T>,
                             compute: Compute<T>) =>
  init$.pipe(
    switchMap((initial) =>
      patch$.pipe(
        scan((acc, curr) =>
          patch(curr, JSON.parse(JSON.stringify(acc))), initial),
        mergeMap((raw) =>
          of(
            rawSink(raw),
            dataSink(compute(raw))
          )),
        startWith(
          rawSink(initial),
          dataSink(compute(initial))))));
