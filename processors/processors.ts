import type {FromEventTarget} from 'rxjs/internal/observable/fromEvent'
import type {Sink, MappedWrapObservable} from 'pkit/core'
import {
  of,
  Observable,
  timer,
  GroupedObservable,
  zip,
  throwError,
  fromEvent,
} from 'rxjs'
import {map, withLatestFrom, mergeMap, scan, switchMap, groupBy, filter, catchError, takeUntil} from 'rxjs/operators'

export type UnwrapObservable<T> = T extends Observable<infer I> ? I : never;
export type MappedUnwrapObservable<T> = {[P in keyof T]: UnwrapObservable<T[P]>}

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

export const mapFilterVoidProc = <T, U, V extends U>(source$: Observable<T>, sink: Sink<U>, fn: MapFn<T, V>) =>
  source$.pipe(
    map((data) =>
      fn(data)),
    filter((data) =>
      data !== undefined),
    map((data) =>
      sink(data)));

export const createMapFilterVoidProc = <T, U, V extends U = U>(fn: MapFn<T, V>) =>
  (source$: Observable<T>, sink: Sink<U>) =>
    mapFilterVoidProc(source$, sink, fn);

export const mapToProc = <T, U extends T>(source$: Observable<unknown>, sink: Sink<T>, data?: U | T) =>
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
    mergeMapOperator(fn, sink, errSink));

export const createMergeMapProc = <T, U, V extends U = U>(fn: MergeMapFn<T, V>) =>
  (source$: Observable<T>, sink: Sink<U>, errSink?: Sink<Error>) =>
    mergeMapProc(source$, sink, fn, errSink);

// TODO: mapToFlatBindProc みたいなのもあるといいかもね。でもそもそもmapProcで間に合うな。。
export const mapToBindProc = <T, U, V extends U>(source$: Observable<T>, sink: Sink<[T, U?]>, bindArg: V) =>
  source$.pipe(
    map((data) =>
      sink([data, bindArg])));

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

export const latestMergeMapProc = <T, U, V extends readonly any[], W extends U = U>(
  source$: Observable<T>, sink: Sink<U>, latests$: MappedWrapObservable<V>, fn: MergeMapFn<[T,...V], W>, errSink?: Sink<Error>) =>
    source$.pipe(
      withLatestFrom(...latests$),
      mergeMapOperator<[T, ...V], U>(fn, sink, errSink)
    );

export const createLatestMergeMapProc = <T, U, V extends readonly any[], W extends U = U>(fn: LatestMergeMapFn<T,V,W>) =>
  (source$: Observable<T>, sink: Sink<U>, latests$: MappedWrapObservable<V>, errSink?: Sink<Error>) =>
    latestMergeMapProc(source$, sink, latests$, fn, errSink);

export const fromEventProc = <T, U extends T>(source$: Observable<FromEventTarget<U>>, sink: Sink<T>, eventName: string) =>
  source$.pipe(
    mergeMap((target) =>
      fromEvent(target, eventName)),
    map((data) =>
      sink(data))
  )

const defaultPatchFn = <T>(data: T) => data;
export const pickProc = <T, U, V extends U = U>(source$: Observable<T>, sink: Sink<U>, query: (data: T) => V, patch: (data: V) => U = defaultPatchFn) =>
  source$.pipe(
    mergeMap((data) =>
      of(data).pipe(
        map((data) =>
          query(data)),
        filter((data) =>
          data !== undefined),
        catchError(() =>
          of(data).pipe(
            filter(() =>
              false))),
        map((data: any) =>
          sink(patch(data))))));

export const intervalMapToProc = <T, U extends T>(running$: Observable<boolean>, sink: Sink<T>, interval: number, data?: U) =>
  running$.pipe(
    filter((running) =>
      running),
    switchMap(() =>
      timer(0, interval).pipe(
        map(() =>
          sink(data)),
        takeUntil(running$.pipe(
          filter((running) =>
            !running))))));

export const intervalLatestMapProc = <T, U extends readonly any[]>(running$: Observable<boolean>,
                                                          sink: Sink<T>, fn: (data: U) => T,
                                                          interval: number = 1000, latests$: MappedWrapObservable<U> = [] as any) =>
  running$.pipe(
    filter((running) =>
      running),
    switchMap(() =>
      timer(0, interval).pipe(
        withLatestFrom<number, U>(...latests$),
        map((data: U) =>
          sink(fn(data))))));

export const zipMergeMapProc = <T, U, V>(source$: Observable<T>, sink: Sink<V>, sources$: [Observable<U>], fn: (data: [T, U]) => Observable<V> | Promise<V>) =>
  zip(source$, ...sources$).pipe(
    mergeMap((data) =>
      fn(data)),
    map(data =>
      sink(data)));

export const groupProc = <T, U>(source$: Observable<T>, sink: Sink<GroupedObservable<U, T>>, groupFunc: (data: T) => U) =>
  source$.pipe(
    groupBy(groupFunc),
    map(group$ =>
      sink(group$)));

export const createGroupProc = <T, U>(groupFn: (data: T) => U) =>
  (source$: Observable<T>, sink: Sink<GroupedObservable<U, T>>) =>
    groupProc(source$, sink, groupFn);

export const exposeGroupProc = <T, U>(source$: Observable<GroupedObservable<U, T>>, sink: Sink<T>, key: U) =>
  source$.pipe(
    filter((group$) =>
      group$.key === key),
    mergeMap((group$) =>
      group$),
    map((data) =>
      sink(data)));
