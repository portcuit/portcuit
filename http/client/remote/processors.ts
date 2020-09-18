import {Sink, SourceSink} from "../../../core";
import {merge, of} from "rxjs";
import {catchError, map, mergeMap} from "rxjs/operators";

export const sendProc = (debugSink: Sink<any>, errSink: Sink<Error>, endpoint: string, sourceSinks: SourceSink[]) =>
  merge(...sourceSinks.map(([source$, sink]) =>
    source$.pipe(
      map((data) =>
        sink(data))))).pipe(
    mergeMap(async (data) =>
      of(data).pipe(
        mergeMap(async () => {
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
          const msg = await res.json();
          return debugSink({send: msg, data})
        }),
        catchError((err) =>
          errSink(err)))));

