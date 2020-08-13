import {fromEvent, Observable, merge, of} from 'rxjs'
import {map, mergeMap, catchError, switchMap} from 'rxjs/operators'
import {Sink, SourceSink, PortMessage} from 'pkit/core'

export const receiveProc = (worker$: Observable<Worker>, prefixPath:string[]=[]) =>
  worker$.pipe(
    switchMap((worker) =>
      fromEvent(worker, 'message').pipe(
        map((ev) =>
          'data' in ev ? ev['data'] : ev),
        map(([type, data]: any) =>
          [prefixPath.concat(type).join('.'), data] as PortMessage<any>)
      )));

export const sendProc = (worker$: Observable<Worker>, msg$: Observable<PortMessage<any>>, infoSink: Sink<any>, errSink: Sink<Error>, sourceSinks: SourceSink[], prefixPath:string[]=[]) =>
  worker$.pipe(
    switchMap((worker) =>
      merge(msg$,
        ...sourceSinks.map(([source$, sink]) =>
          source$.pipe(
            map((data) =>
              sink(data)),
            map(([type, data]) =>
              [type.split('.').slice(prefixPath.length).join('.'), data])))).pipe(
        mergeMap((data) =>
          of(data).pipe(
            map((data) =>
              infoSink({send: worker.postMessage(data), data})),
            catchError((err) =>
              of(errSink(err))))))));