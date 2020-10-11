import {promisify} from "util";
import {merge, Observable, of} from "rxjs";
import {catchError, filter, map, mergeMap, switchMap} from "rxjs/operators";
import {PortMessage, Sink, SinkMap, SourceMap} from "pkit/core";
import {RequestArgs} from "../processors";

export const receiveProc = (body$: Observable<string>, jsonSink: Sink<any>, errSink: Sink<Error>, sinkMap: SinkMap) =>
  body$.pipe(
    switchMap((body) =>
      of(body).pipe(
        map((body) =>
          JSON.parse(body)),
        filter(([path]) =>
          sinkMap.has(path)),
        mergeMap(([path,data]) =>
          of(
            sinkMap.get(path)!(data),
            jsonSink({result: true}))),
        catchError((err) =>
          of(errSink(err))))));

// export const receiveProc = (body$: Observable<string>, msgSink: Sink<PortMessage<any>>, jsonSink: Sink<any>, errSink: Sink<Error>, sinkMap: SinkMap) =>
//   body$.pipe(
//     switchMap((body) =>
//       of(body).pipe(
//         map((body) =>
//           JSON.parse(body)),
//         filter(([path]) =>
//           sinkMap.has(path)),
//         mergeMap(([path,data]) =>
//           of(
//             msgSink(sinkMap.get(path)!(data)),
//             jsonSink({result: true}))),
//         catchError((err) =>
//           of(errSink(err))))));

export const sendProc = (ctx$: Observable<RequestArgs>, sink: Sink<PortMessage<any>>, sourceMap: SourceMap) =>
  ctx$.pipe(
    switchMap(([req, res]) =>
      merge(...Array.from(sourceMap.entries()).map(([path, source$]) =>
        source$.pipe(
          map((data) =>
            sink([path, data]))))
      )
    )
  );
