import json8 from 'json8'
import mergePatch from 'json8-merge-patch'
import {Sink, sink, Socket, source} from "../core/";
import {merge, Observable, of} from "rxjs";
import {directProc} from "../processors";
import {map, scan, startWith, switchMap} from "rxjs/operators";

export type StateFlow = {
  start: boolean;
  finish: boolean;
  doing: boolean;
  done: boolean;
}

export type FlowState = {
  flow: {
    init: StateFlow
  }
}

export const initialStateFlow = (): StateFlow =>
  ({
    start: false,
    finish: false,
    doing: false,
    done: false
  });

export const startFlow = <T extends string>(p: T) =>
  [
    {flow: {[p]: {start: true}}},
    {flow: {[p]: {start: false}}}
  ] as {flow: {[P in T]: {start: boolean}}}[]

export const isStartFlow = <T extends string>(p: T) =>
  <U extends {flow?: {[P in T]?: any }}>([state]: U[]) => {
    if (!state.flow) { return false; }
    if ( !(p in state.flow) ) { return false }
    return (state.flow[p] as any).start === true;
  }

export const finishFlow = <T extends string>(p: T) =>
  [
    {flow: {[p]: {finish: true}}},
    {flow: {[p]: {finish: false}}}
  ] as {flow: {[P in T]: {finish: boolean}}}[]

export const isFinishFlow = <T extends string>(p: T) =>
  <U extends {flow?: {[P in T]?: any }}>([state]: U[]) => {
    if (!state.flow) { return false; }
    if ( !(p in state.flow) ) { return false }
    return (state.flow[p] as any).finish === true;
  }

export const singlePatch = <T>(patch: T) =>
  [[patch]]

export type UpdateBatch<T extends {}> = PartialState<T>[][]

export class StatePort<T extends {}> {
  init = new Socket<[T, UpdateBatch<T>?]>();
  update = new Socket<UpdateBatch<T>>();
  data = new Socket<[T, T]>();

  circuit () {
    const port = this;
    return directProc(source(port.init).pipe(
      switchMap(([initial, initialUpdateBatch=[finishFlow('init')]]) =>
        source(port.update).pipe(
          startWith(initialUpdateBatch),
          map((batch) => {
            const pres = [];
            const posts = [];
            for (const patches of batch) {
              pres.push(patches[0]);
              if (patches[1]) { posts.push(patches[1]); }
            }
            return [pres, posts] as const;
          }),
          scan(([, fromData], [pres, posts]) => {
            const data = pres.reduce((acc, patch) =>
              mergePatch.apply(acc, patch), json8.clone(fromData));

            const postData = posts.reduce((acc, patch) =>
              mergePatch.apply(acc, patch), json8.clone(data));

            return [data, postData] as [T, T]
          }, [{}, initial] as [T, T])
        ))),
      sink(port.data))
  }
}

type Primitive<T> =
  T extends Boolean ? T :
    T extends Number ? T :
      T extends String ? T :
        never

declare const extra: unique symbol;

type PartialState<T> =
  T extends Primitive<T> ? T :
    T extends object ?
      { [P in keyof T]?: PartialState<T[P]>; } & {[extra]?: Error}
      : T;
