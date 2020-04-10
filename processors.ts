import {app} from 'electron'
import {fromEvent, Observable} from 'rxjs'
import {map, switchMap} from 'rxjs/operators'
import {Sink} from 'pkit/core'
import {createMapProc} from 'pkit/processors'

export const readyEventSink = (source$: Observable<unknown>, sink: Sink<unknown>) =>
  source$.pipe(
    switchMap(() =>
      fromEvent(app, 'ready').pipe(
        map(() =>
          sink()))));

export const quitSink = createMapProc<unknown, void>(
  () =>
    app.quit());

export const windowAllClosedEventSink = (sink: Sink<void>) =>
  fromEvent(app, 'window-all-closed').pipe(
    map(() =>
      sink()));