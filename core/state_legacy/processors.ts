import {tuple} from '@pkit/core'

export type PartialState<T> =
  T extends ReadonlyArray<infer I> ? ReadonlyArray<PartialState<I>> :
    T extends Array<infer I> ? Array<PartialState<I>> :
      T extends EphemeralObject<infer I> ? EphemeralObject<I> :
        T extends Primitive<T> ? T :
          T extends object ? {[P in keyof T]?: PartialState<T[P]>} : T;

type Primitive<T> =
  T extends Boolean ? T :
    T extends Number ? T :
      T extends String ? T :
        never

export class ReplaceArray<T> extends Array {
  constructor(...props: T[]) {
    // @ts-ignore
    super(...props);
  }
}

export class ReplaceObject<T> {
  constructor(data: T) { Object.assign(this, data); }
}

export class EphemeralBoolean extends Boolean {
  constructor(data: boolean) { super(data); }
  toJSON() { return undefined; }
}

export class EphemeralString extends String {
  constructor(data: string) { super(data); }
  toJSON() { return undefined; }
}

export class EphemeralNumber extends Number {
  constructor(data: number) { super(data); }
  toJSON() { return undefined; }
}

export class EphemeralContainer<T=any> extends Object {
  constructor(public data: T) { super(); }
  toJSON() { return undefined; }
}

export type EphemeralObject<T> = T & {
  readonly brand: unique symbol;
  // valueOf(): T;
}

export const EphemeralObject = (function <T>(this: {new(data: any):EphemeralObject<T>}, data: T) {
  Object.assign(this, data);
  this.valueOf = () => data;
} as unknown) as {new<T>(data: T): EphemeralObject<T>}

EphemeralObject.prototype.toJSON = () => undefined

export const patch = (
  plan: any,
  data: any) => {

  if (plan === null
    || plan === undefined
    || plan.constructor === Boolean
    || plan.constructor === EphemeralBoolean
    || plan.constructor === EphemeralContainer
    || plan.constructor === EphemeralObject
    || plan.constructor === EphemeralString
    || plan.constructor === EphemeralNumber
    || plan.constructor === String
    || plan.constructor === Number
    || plan.constructor === ReplaceArray
    || plan.constructor === ReplaceObject
  ) {
    return plan;
  } else if (plan.constructor === Array) {
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
      || data.constructor === EphemeralBoolean
      || plan.constructor === EphemeralContainer
      || plan.constructor === EphemeralObject
      || plan.constructor === EphemeralString
      || plan.constructor === EphemeralNumber
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

export const splice = <T>(start: number, deleteCount=0, items: T[]=[]): T[] =>
  Array(start).concat(Array(deleteCount).fill(undefined)).concat(...items);

export const padArray = <T>(start: number, item: T, end: number = 0): T[] =>
  Array(start).concat(item, Array(end))

export const makePatch = <T, U, V extends (data: T) => U>(fn: V, data: T) =>
  tuple(fn, data)

export type Patch<T, U=any> = [(data: U) => PartialState<T>, U]
export type EncodedPatch = [string, any]

export const encodePatch = <T>([fn, data]: Patch<T>): EncodedPatch =>
  [fn.toString(), data]

const pkit = {ReplaceObject, ReplaceArray, EphemeralBoolean, EphemeralString, EphemeralNumber, EphemeralObject, EphemeralContainer, splice, padArray}
const pkit_1 = pkit;
const index_1 = pkit;
export const decodePatch = <T>([fn, data]: EncodedPatch) =>
  new Function(`return ({ReplaceObject, ReplaceArray, EphemeralBoolean, EphemeralString, EphemeralNumber, EphemeralContainer, EphemeralObject, splice, padArray, pkit, pkit_1, index_1}) => ${fn};`)()
  ({ReplaceObject, ReplaceArray, EphemeralBoolean, EphemeralString, EphemeralNumber, EphemeralContainer, EphemeralObject, splice, padArray, pkit, pkit_1, index_1})(data) as PartialState<T>

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T[P] extends ReadonlyArray<infer U>
      ? ReadonlyArray<DeepPartial<U>>
      : T[P] extends Object
        ? DeepPartial<T[P]> : T[P]
};

export const toRecord = <T extends {[key: string]: any}, U extends keyof T>(rows: Array<T>, id: U) => {
  return rows.reduce((memo, curr) =>
    ({
      ...memo,
      [curr[id]]: curr
    }), {}) as Record<T[U], T>
}

export type StateRecord<T extends {[key: string]: any}, U extends keyof T> = Record<T[U], T>