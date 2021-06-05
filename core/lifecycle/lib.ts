import {Observable} from 'rxjs'
import {mergeMap, take, map, startWith} from 'rxjs/operators'
import {Sink} from '../core/'

// It needs to have being started for restarting.
export const restartProc = (
  restart$: Observable<void>,
  stopped$: Observable<void>,
  started$: Observable<void>,
  stopSink: Sink<void>,
  restartingSink: Sink<boolean>,
  startSink: Sink<void>,
  restartedSink: Sink<void>) =>
  restart$.pipe(
    mergeMap(() =>
      stopped$.pipe(
        take(1),
        mergeMap(() =>
          started$.pipe(
            take(1),
            map(() =>
              restartedSink()),
            startWith(startSink(), restartingSink(false)))),
        startWith(stopSink(), restartingSink(true)))));
