import {Worker as NodeWorker} from 'worker_threads'
import {fromEvent, Observable, merge} from 'rxjs'
import {map, switchMap, filter} from 'rxjs/operators'
import {Sink, PortMessage, SinkMap, SourceMap} from '@pkit/core'

export const receiveProc = (worker$: Observable<Worker | NodeWorker>, sinkMap: SinkMap) =>
  worker$.pipe(
    switchMap((worker) =>
      fromEvent<PortMessage<any>>(worker, 'message').pipe(
        map((ev) =>
          'data' in ev ? ev['data'] : ev),
        filter(([path]) =>
          sinkMap.has(path)),
        map(([path,data]) =>
          sinkMap.get(path)!(data)))));

export const sendProc = (worker$: Observable<Worker | NodeWorker>, sink: Sink<PortMessage<any>>, sourceMap: SourceMap) =>
  worker$.pipe(
    switchMap((worker) =>
      merge(...Array.from(sourceMap.entries()).map(([path, source$]) =>
        source$.pipe(
          map((data) =>
            sink([path, data])))))))
