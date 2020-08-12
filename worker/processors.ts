import {Observable, fromEvent, of} from 'rxjs'
import {switchMap, finalize, mergeMap, startWith, withLatestFrom, map, catchError} from 'rxjs/operators'
import {Sink, EventError} from 'pkit/core'
export type WorkerInfo = [string, WorkerOptions?]
export type WorkerConstructor = new(...args: [...WorkerInfo[]]) => Worker

export const createProc = (source$: Observable<void>, args$: Observable<WorkerInfo>, sink: Sink<any>, errSink: Sink<Error>, Worker: WorkerConstructor) =>
  source$.pipe(
    withLatestFrom(args$),
    switchMap(([,workerInfo]) => {
      const worker = new Worker(...(workerInfo as any));
      return of(worker).pipe(
        mergeMap((currWorker) =>
          fromEvent(currWorker, 'error').pipe(
            map((err) =>
              errSink(new EventError(err))),
            finalize(() =>
              currWorker.terminate()),
            startWith(sink(currWorker)))))
    }));
