import type {FromEventTarget} from 'rxjs/internal/observable/fromEvent'
import {
  of,
  Observable,
  timer,
  GroupedObservable,
  zip,
  throwError,
  fromEvent,
} from 'rxjs'
import {
  map,
  withLatestFrom,
  mergeMap,
  scan,
  switchMap,
  groupBy,
  filter,
  catchError,
  takeUntil,
  share
} from 'rxjs/operators'
import type {Sink, MappedWrapObservable, PortMessage} from '@pkit/core'

export type UnwrapObservable<T> = T extends Observable<infer I> ? I : never;
export type MappedUnwrapObservable<T> = {[P in keyof T]: UnwrapObservable<T[P]>}

export const ofProc = <T, U extends T>(sink: Sink<T>, value: U = undefined as any) =>
  of(value).pipe(
    map((data) =>
      sink(data)));

export const directProc = <T>(source$: Observable<T>, sink: Sink<T>) =>
  source$.pipe(
    map((data) =>
      sink(data)));

export const filterProc = <T>(source$: Observable<T>, sink: Sink<T>, fn: FilterFn<T>) =>
  source$.pipe(
    filter((data) =>
      fn(data)),
    map(data =>
      sink(data)));

type FilterFn<T> = (data: T) => boolean
export const filterMapProc = <T, U, V extends U>(source$: Observable<T>, sink: Sink<U>, filterFn: FilterFn<T>, mapFn: MapFn<T, V>) =>
  source$.pipe(
    filter((data) =>
      filterFn(data)),
    map((data) =>
      sink(mapFn(data))));

type MapFn<T, U> = (data: T) => U
export const mapProc = <T, U, V extends U>(source$: Observable<T>, sink: Sink<U>, fn: MapFn<T, V>) =>
  source$.pipe(
    map((data) =>
      sink(fn(data))));

export const createMapProc = <T, U>(fn: (data: T) => U) =>
  (source$: Observable<T>, sink: Sink<U>) =>
    mapProc(source$, sink, fn);

export const mapToProc = <T, U extends T>(source$: Observable<unknown>, sink: Sink<T>, data: U | T = undefined as any) =>
  source$.pipe(
    map(() =>
      sink(data)));

type MergeMapFn<T, U> = (data: T) => Observable<U> | Promise<U>

const mergeMapOperator = <T, U>(fn: MergeMapFn<T, U>, sink: Sink<U>, errSink?: Sink<Error>) =>
  mergeMap((data: T) =>
    of(true).pipe(
      mergeMap(() =>
        fn(data)),
      map((data: U) =>
        sink(data)),
      catchError(err =>
        errSink ? of(errSink(err)) : throwError(err))));

export const mergeMapProc = <T, U, V extends U>(source$: Observable<T>, sink: Sink<U>, fn: MergeMapFn<T, V>, errSink?: Sink<Error>) =>
  source$.pipe(
    mergeMapOperator(fn, sink, errSink)) as Observable<PortMessage<V>>;

export const createMergeMapProc = <T, U, V extends U = U>(fn: MergeMapFn<T, V>) =>
  (source$: Observable<T>, sink: Sink<U>, errSink?: Sink<Error>) =>
    mergeMapProc(source$, sink, fn, errSink);

export const latestProc = <T>(source$: Observable<unknown>, sink: Sink<T>, latest$: Observable<T>) =>
  source$.pipe(
    withLatestFrom(latest$),
    map(([,latest]) =>
      sink(latest)));

export const withLatestProc = <T, U extends readonly any[]>(source$: Observable<T>, sink: Sink<[T, ...U]>, latests$: MappedWrapObservable<U>) =>
  source$.pipe(
    withLatestFrom(...latests$),
    map((data: any) =>
      sink(data)));

type LatestFn<T, U extends readonly any[], V> = (data: [T, ...U]) => V;

export const latestMapProc = <T, U, V extends readonly any[], W extends U = U>(
  source$: Observable<T>, sink: Sink<U>, latests$: MappedWrapObservable<V>, fn: LatestFn<T,V,W>) =>
  source$.pipe(
    withLatestFrom(...latests$),
    map((data: any) =>
      sink(fn(data))));

export const createLatestMapProc = <T, U, V extends readonly any[] = [], W extends U = U>(fn: LatestFn<T,V,W>) =>
  (source$: Observable<T>, sink: Sink<U>, latests$: MappedWrapObservable<V> = [] as any) =>
    latestMapProc(source$, sink, latests$, fn);

type LatestMergeMapFn<T, U extends readonly any[], V> = (data: [T, ...U]) => Observable<V> | Promise<V>;

export const latestMergeMapProc = <T, U, V extends readonly any[], W extends U>(
  source$: Observable<T>, sink: Sink<U>, latests$: MappedWrapObservable<V>, fn: MergeMapFn<[T,...V], W>, errSink?: Sink<Error>) =>
    source$.pipe(
      withLatestFrom(...latests$),
      mergeMapOperator<[T, ...V], U>(fn, sink, errSink)
    ) as Observable<PortMessage<W>>;

export const createLatestMergeMapProc = <T, U, V extends readonly any[], W extends U = U>(fn: LatestMergeMapFn<T,V,W>) =>
  (source$: Observable<T>, sink: Sink<U>, latests$: MappedWrapObservable<V>, errSink?: Sink<Error>) =>
    latestMergeMapProc(source$, sink, latests$, fn, errSink);

const _resultSelector = (...args: any[]) => args

export const fromEventProc = <T, U extends T>(source$: Observable<FromEventTarget<U>>, terminated$: Observable<void>, sink: Sink<T>, eventName: string, resultSelector = (...args: any[]) => (args.length === 1 ? args[0] : args) as any) =>
  source$.pipe(
    switchMap((target) =>
      fromEvent(target, eventName, resultSelector)),
    map((data) =>
      sink(data)),
    takeUntil(terminated$)
  )

export const preparePatchProc = <T, U, V extends (data: T) => U>(source$: Observable<T>, sink: Sink<[V, T]>, fn: V) =>
  source$.pipe(
    map((data) =>
      sink([fn, data]))
  )

export const conditionalProc = <T>(source$: Observable<T>, sinkA: Sink<T>, sinkB: Sink<T>, condFn: (data: T) => boolean) =>
  source$.pipe(
    map((data) =>
      condFn(data) ? sinkA(data) : sinkB(data)))