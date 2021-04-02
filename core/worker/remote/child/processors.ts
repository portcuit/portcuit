import {fromEvent, merge, of} from 'rxjs'
import {map, mergeMap, catchError, filter} from 'rxjs/operators'
import {Sink, PortMessage, SinkMap, SourceMap} from '@pkit/core'

export const receiveProc = (parentPort: MessagePort, sinkMap: SinkMap) =>
  fromEvent<PortMessage<any>>(parentPort, 'message').pipe(
    map((ev) =>
      'data' in ev ? ev['data'] : ev),
    filter(([path]) =>
      sinkMap.has(path)),
    map(([path,data]) =>
      sinkMap.get(path)!(data)));

export const sendProc = (debugSink: Sink<any>, errSink: Sink<Error>, parentPort: MessagePort, sourceMap: SourceMap) =>
  merge(...Array.from(sourceMap.entries()).map(([path, source$]) =>
    source$.pipe(
      mergeMap((data) =>
        of(data).pipe(
          map((data) =>
            debugSink({
              send: parentPort.postMessage([path, data]),
              path, data
            })),
          catchError((err) =>
            of(errSink(err))))))))
