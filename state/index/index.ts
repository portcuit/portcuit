import json8 from 'json8'
import mergePatch from 'json8-merge-patch'
import {map, scan, startWith} from "rxjs/operators";
import {sink, Socket, source, directProc, Port, cycleFlow} from "@pkit/core";

export class StatePort<T extends {}> extends Port {
  init = new Socket<T>();
  update = new Socket<UpdateBatch<T>>();
  data = new Socket<[T, T, T]>();

  flow () {
    return cycleFlow(this, 'init', 'terminated', {
      initFlow: (port, initial: T) =>
        directProc(source(port.update).pipe(
          map((batch) => {
            const patches = [];
            const postPathces = [];
            for (const pair of batch) {
              patches.push(pair[0]);
              if (pair[1]) {postPathces.push(pair[1]);}
            }
            return [patches, postPathces] as const;
          }),
          scan(([, prevData], [patches, postPatches]) => {
            const data = patches.reduce((acc, patch) =>
              mergePatch.apply(acc, patch), json8.clone(prevData));

            const postData = postPatches.reduce((acc, patch) =>
              mergePatch.apply(acc, patch), json8.clone(data));

            return [data, postData, prevData] as [T, T, T]
          }, [{}, initial, initial] as [T, T, T]),
          startWith([initial, initial, initial] as [T, T, T])),
          sink(port.data))
    })
  }
}

export const singlePatch = <T> (patch: T) =>
  [[patch]]

export type UpdateBatch<T extends {}> = PartialState<T>[][]
export type InferUpdateBatch<T> = T extends UpdateBatch<infer I> ? I : never

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