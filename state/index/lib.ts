export type UpdateBatch<T extends {}> = PartialState<T>[]
export type InferUpdateBatch<T> = T extends UpdateBatch<infer I> ? I : never

export type StateData<T extends {}> = [data: T, batch: UpdateBatch<T>, prevData: T]

declare const extra: unique symbol;

export type PartialState<T> =
  T extends object ?
  {[P in keyof T]?: PartialState<T[P]> | null} :
  T | null;

export const toRecord = <T extends {[key: string]: any}, U extends keyof T> (id: U, rows: Array<T>) => {
  return rows.reduce((memo, curr) =>
  ({
    ...memo,
    [curr[id]]: curr
  }), {}) as Record<T[U], T>
}

export type StateRecord<T extends {[key: string]: any}, U extends keyof T> = Record<T[U], T>