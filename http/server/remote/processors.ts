import {promisify} from "util";
import {merge, Observable, of} from "rxjs";
import {catchError, filter, map, mergeMap, switchMap} from "rxjs/operators";
import {PortMessage, Sink, SinkMap, SourceMap} from "pkit/core";
import {RequestArgs} from "../processors";

export const receiveProc = (body$: Observable<string>, msgSink: Sink<PortMessage<any>>, jsonSink: Sink<any>, errSink: Sink<Error>, sinkMap: SinkMap) =>
  body$.pipe(
    switchMap((body) =>
      of(body).pipe(
        map((body) =>
          JSON.parse(body)),
        filter(([path]) =>
          sinkMap.has(path)),
        mergeMap(([path,data]) =>
          of(
            msgSink(sinkMap.get(path)!(data)),
            jsonSink({result: true}))),
        catchError((err) =>
          of(errSink(err))))));

export const sendProc = (ctx$: Observable<RequestArgs>, debugSink: Sink<any>, errSink: Sink<Error>, sourceMap: SourceMap) =>
  ctx$.pipe(
    switchMap(([req, res]) =>
      merge(...Array.from(sourceMap.entries()).map(([path, source$]) =>
        source$.pipe(
          mergeMap((data) =>
            of(data).pipe(
              mergeMap(async (data) =>
                debugSink({
                  send: await promisify(res.write).call(res, `data: ${JSON.stringify([path, data])}\n\n`),
                  path, data
                })),
              catchError((err) =>
                of(errSink(err))))))))));
