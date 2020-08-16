import {fromEvent, Observable, merge, of} from 'rxjs'
import {map, mergeMap, catchError} from 'rxjs/operators'
import {Sink, PortMessage, SourceSink} from 'pkit/core'

export const receiveProc = (parentPort: MessagePort): Observable<PortMessage<any>> =>
  fromEvent(parentPort, 'message').pipe(
    map((ev) =>
      'data' in ev ? ev['data'] : ev),
    map((data: any) =>
      data));

export const sendProc = (debugSink: Sink<any>, errSink: Sink<Error>, parentPort: MessagePort, sourceSinks: SourceSink[]) =>
  merge(...sourceSinks.map(([source$, sink]) =>
    source$.pipe(
      map((data) =>
        sink(data))))).pipe(
    mergeMap((data) =>
      of(data).pipe(
        map((data) =>
          debugSink({send: parentPort.postMessage(data), data})),
        catchError((err) =>
          of(errSink(err))))));
