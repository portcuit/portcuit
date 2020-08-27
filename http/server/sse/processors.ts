import type {SseServerParams} from "./";
import {promisify} from "util";
import {from, merge, Observable} from "rxjs";
import {map, mapTo, mergeMap, switchMap, takeUntil, tap, withLatestFrom} from "rxjs/operators";
import {Sink, SourceSink} from "pkit/core";

export const connectProc = (source$: Observable<SseServerParams>, sink: Sink<string>) =>
  source$.pipe(
    mergeMap(({args: [,res], retry}) => {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform no-store',
        'X-Accel-Buffering': 'no',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': '*'
      });
      return promisify<string>(res.write).call(res, `retry: ${retry}\n\n`);
    }),
    map(() =>
      sink((new Date).getTime().toString())));

export const sendProc = (params$: Observable<SseServerParams>, close$: Observable<void>, sink: Sink<any>, sourceSinks: SourceSink[]) =>
    merge(
      ...sourceSinks.map(([source$, sink]) =>
        source$.pipe(
          map((data) =>
            sink(data))))).pipe(
      takeUntil(close$),
      withLatestFrom(params$),
      mergeMap(async ([[type, data], {args:[,res]}]) =>
        sink({
          send: await promisify<string>(res.write).call(res, `data: ${JSON.stringify([type, data])}\n\n`),
          data
        })));

      // mergeMap(([msg, clients]) =>
      //   of(...Array.from(clients).map(([,request]) =>
      //     sendSink([JSON.stringify(msg), request])))));

// import {promisify} from 'util'
// import {of, from, fromEvent, Observable, merge} from 'rxjs'
// import {withLatestFrom, mergeMap} from 'rxjs/operators'
// import {Sink, SourceSink} from 'pkit/core'
// import {map, take, switchMap} from 'rxjs/operators'
// import {createMapProc, createMergeMapProc, createLatestMapProc} from 'pkit/processors'
// import type {RequestArgs} from '../'
//
// export const remoteSendProc = (clients$: Observable<Clients>, sendSink: Sink<PDSend>, sourceSinks: SourceSink[]) =>
//     merge(
//       ...sourceSinks.map(([source$, sink]) =>
//         source$.pipe(
//           map((data) =>
//             sink(data))))
//     ).pipe(
//       withLatestFrom(clients$),
//       mergeMap(([msg, clients]) =>
//         of(...Array.from(clients).map(([,request]) =>
//           sendSink([JSON.stringify(msg), request])))));
//
// export const closeProc = createMergeMapProc<RequestArgs, RequestArgs>(
//   ([req, res]) =>
//     fromEvent(req, 'close').pipe(
//       take(1),
//       map(() =>
//         [req, res])));
//
// export const connectProc = (retry: number = 3000) =>
//   createMapProc<RequestArgs, any>(
//     ([req, res]) => {
//       res.writeHead(200, {
//         'Content-Type': 'text/event-stream; charset=utf-8',
//         'Cache-Control': 'no-cache, no-transform no-store',
//         'X-Accel-Buffering': 'no',
//         'Connection': 'keep-alive',
//         'Access-Control-Allow-Origin': '*',
//         'Access-Control-Allow-Headers': '*',
//         'Access-Control-Allow-Methods': '*'
//       });
//       res.write(`retry: ${retry}\n\n`);
//       return ['sse.send.headers']
//     });
//
// type Message = string;
// export type PDSend = [Message, RequestArgs]
// export const sendProc = createMergeMapProc<PDSend, void>(
//   ([msg, [req, res]]) =>
//     promisify(res.write).bind(res)(`data:${msg}\n\n`));
//
// export type Clients = Map<RequestArgs[1], RequestArgs>;
//
// export const setProc = createLatestMapProc<RequestArgs, any, [Clients]>(
//   ([[req, res], clients]) =>
//     ['sse.clients.set', clients.set(res, [req, res])]);
//
// export const deleteProc = createLatestMapProc<RequestArgs, any, [Clients]>(
//   ([[req, res], clients]) =>
//     ['sse.clients.delete', clients.delete(res)]);
