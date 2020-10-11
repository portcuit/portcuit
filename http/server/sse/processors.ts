import {promisify} from "util";
import {Observable} from "rxjs";
import {mergeMap} from "rxjs/operators";
import {Sink} from "pkit/core";
import {HttpServerContext} from "../processors";

export const connectProc = (source$: Observable<HttpServerContext>, sink: Sink<void>, retry: number) =>
  source$.pipe(
    mergeMap(async ([req,res]) => {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform no-store',
        'X-Accel-Buffering': 'no',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': '*'
      });
      return sink(await promisify<string>(res.write).call(res, `retry: ${retry}\n\n`));
    }));