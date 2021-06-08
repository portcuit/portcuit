import test from 'ava'
import assert from 'assert'
import {merge, lastValueFrom} from "rxjs";
import {delay, filter, map, startWith, take, switchMap, toArray} from "rxjs/operators";
import {sink, source, PortMessage, mapToProc, Socket} from "@pkit/core";
import {LifecyclePort} from './';

export class LifecycleTestPort extends LifecyclePort {
  init = new Socket<void>();

  flow () {
    const port = this;
    return merge(
      super.flow(),

      mapToProc(source(port.init), sink(port.ready)),
      mapToProc(source(port.start).pipe(delay(100)), sink(port.started)),
      mapToProc(source(port.stop).pipe(delay(100)), sink(port.stopped)),
      mapToProc(source(port.terminate).pipe(delay(100)), sink(port.complete)),

      mapToProc(source(port.ready), sink(port.start)),

      mapToProc(source(port.running).pipe(
        filter((running) =>
          running),
        take(1)),
        sink(port.restart)),

      source(port.restarted).pipe(
        switchMap(() =>
          source(port.stopped).pipe(
            map(() =>
              sink(port.terminate)(null)),
            startWith(sink(port.stop)(null)))))
    )
  }

  includes () {return [];}
}

type FindLogs = (log: PortMessage<any>) => boolean
export const findLogsTerminate: FindLogs = ([type]) =>
  type === 'terminate'
export const findLogsTerminated: FindLogs = ([type]) =>
  type === 'complete'
export const findLogsStopped: FindLogs = ([type]) =>
  type === 'stopped'


const restartAssert = (res: PortMessage<any>[]) => {
  const restartIndex = res.findIndex(([type]) =>
    type === 'restart');
  assert(restartIndex >= 0, 'リスタートすること');
  assert(res.slice(0, restartIndex)
    .find(([type]) =>
      type === 'started'), 'restart前にstartしていること');

  const afterRestart = res.slice(restartIndex)
  const restartedIndex = afterRestart.findIndex(([type]) =>
    type === 'restarted');
  assert(restartedIndex >= 0, 'リスタートが完了したこと');

  const betweenRestartAndRestarted = afterRestart.slice(0, restartedIndex);
  const stoppedIndex = betweenRestartAndRestarted
    .findIndex(([type]) => type === 'stopped');
  const startedIndex = betweenRestartAndRestarted
    .findIndex(([type]) => type === 'started');
  assert(stoppedIndex >= 0);
  assert(startedIndex >= 0);
  assert(stoppedIndex < startedIndex, 'ストップ後にスタートすること');
}

test('it should restart', async () => {
  let res = await lastValueFrom(new LifecycleTestPort().run().pipe(toArray()));
  restartAssert(res);
})
