export const singlePatch = <T> (patch: T) =>
  [[patch]]

export type UpdateBatch<T extends {}> = PartialState<T>[][]
export type InferUpdateBatch<T> = T extends UpdateBatch<infer I> ? I : never

export type StateData<T extends {}> = [data: T, postData: T, prevData: T]

declare const extra: unique symbol;

export type PartialState<T> =
  T extends object ?
  {[P in keyof T]?: PartialState<T[P]> | null;} & {[extra]?: Error} :
  T | null;

type Primitive<T> =
  T extends Boolean ? T :
  T extends Number ? T :
  T extends String ? T :
  never

export type PartialStateX<T> =
  T extends Primitive<T> ? T :
  T extends object ?
  {[P in keyof T]?: PartialState<T[P]>;} & {[extra]?: Error}
  : T;

export const toRecord = <T extends {[key: string]: any}, U extends keyof T> (id: U, rows: Array<T>) => {
  return rows.reduce((memo, curr) =>
  ({
    ...memo,
    [curr[id]]: curr
  }), {}) as Record<T[U], T>
}

export type StateRecord<T extends {[key: string]: any}, U extends keyof T> = Record<T[U], T>