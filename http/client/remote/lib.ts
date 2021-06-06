import {merge, Observable, of} from "rxjs";
import {catchError, filter, map, mergeMap} from "rxjs/operators";
import {Sink, SourceMap, PortMessage, SinkMap} from "@pkit/core";

export const receiveProc = (msg$: Observable<PortMessage<any>>, sinkMap: SinkMap) =>
  msg$.pipe(
    filter(([path]) =>
      sinkMap.has(path)),
    map(([path, data]) =>
      sinkMap.get(path)!(data)));

export const sendProc = (debugSink: Sink<any>, errSink: Sink<Error>, endpoint: string, sourceMap: SourceMap) =>
  merge(...Array.from(sourceMap.entries()).map(([path, source$]) =>
    source$.pipe(
      mergeMap((data) =>
        of(data).pipe(
          mergeMap(async () => {
            const res = await fetch(endpoint, {
              method: 'POST',
              headers: {
                'Accept': 'application/json; charset=utf-8',
                'Content-Type': 'application/json; charset=utf-8'
              },
              body: JSON.stringify([path, data])
            });
            const msg = await res.json();
            return debugSink({send: msg, path, data})
          }),
          catchError((err) =>
            of(errSink(err))))))));
