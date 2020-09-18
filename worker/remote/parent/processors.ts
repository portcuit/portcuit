import {fromEvent, Observable, merge, of} from 'rxjs'
import {map, mergeMap, catchError, switchMap, filter} from 'rxjs/operators'
import {Sink, PortMessage, SinkMap, SourceMap} from 'pkit/core'

export const receiveProc = (worker$: Observable<Worker>, sinkMap: SinkMap) =>
  worker$.pipe(
    switchMap((worker) =>
      fromEvent<PortMessage<any>>(worker, 'message').pipe(
        map((ev) =>
          'data' in ev ? ev['data'] : ev),
        filter(([path]) =>
          sinkMap.has(path)),
        map(([path,data]) =>
          sinkMap.get(path)!(data)))));

export const sendProc = (worker$: Observable<Worker>, debugSink: Sink<any>, errSink: Sink<Error>, sourceMap: SourceMap) =>
  worker$.pipe(
    switchMap((worker) =>
      merge(...Array.from(sourceMap.entries()).map(([path, source$]) =>
        source$.pipe(
          mergeMap((data) =>
            of(data).pipe(
              map((data) =>
                debugSink({
                      send: worker.postMessage([path, data]),
                      path, data
                })),
              catchError((err) =>
                of(errSink(err))))))))))
