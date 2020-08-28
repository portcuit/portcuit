import {Observable} from "rxjs";
import {concatMap, delay, filter, map, mergeMap, startWith, take, withLatestFrom} from "rxjs/operators";
import {Sink} from "pkit/core";

export const restartProc = (source$: Observable<any>, running$: Observable<boolean>,
                            stopped$: Observable<unknown>, started$: Observable<unknown>,
                            runningSink: Sink<boolean>, restartedSink: Sink<any>) =>
  source$.pipe(
    withLatestFrom(running$),
    filter(([,running]) =>
      running),
    mergeMap(([data]) =>
      stopped$.pipe(
        take(1),
        mergeMap(() =>
          started$.pipe(
            take(1),
            map(() =>
              restartedSink(data)),
            startWith(runningSink(true)),
          )
        ),
        startWith(runningSink(false))
      )),
    delay(0)
  )
