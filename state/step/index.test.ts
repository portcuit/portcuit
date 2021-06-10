import test from 'ava'
import {merge} from "rxjs";
import {filter, toArray} from "rxjs/operators";
import {sink, source, Port, mapToProc, ofProc} from "@pkit/core";
import {StatePort, singlePatch} from '../index/'
import {StepState} from "./state";
import {finishStep, isFinishStep} from './lib'

type StateTestState = {
  talkId?: string;
  talk?: {
    talentId: number;
  };
  step: {
    init: StepState;
    findTalk: StepState;
  };
}

const initialState = (): StateTestState =>
({
  talk: {
    talentId: 1
  },
  step: {
    init: StepState.initialState(),
    findTalk: StepState.initialState()
  }
});

class StateTestPort extends Port {
  state = new StatePort<StateTestState>()

  initStateFlow = (port: this) =>
    merge(
      ofProc(sink(port.state.init), initialState()),
      mapToProc(source(port.state.init), sink(port.state.update),
        [finishStep('init')])
    )

  singlePatchFlow = (port: this) =>
    mapToProc(source(port.state.data).pipe(
      filter(isFinishStep('init'))),
      sink(port.state.update),
      singlePatch({talkId: '5'}))

  findTalkFlow = (port: this) =>
    mapToProc(source(port.state.data).pipe(
      filter(([{talkId}]) =>
        talkId === '5')),
      sink(port.state.update),
      [
        [{
          talkId: '3',
          talk: {talentId: 3}
        }],
        finishStep('findTalk')
      ])

  terminateFlow = (port: this) =>
    mapToProc(source(port.state.data).pipe(
      filter(isFinishStep('findTalk'))),
      sink(port.complete))

  flow () {
    return merge(
      super.flow(),
      this.state.flow(),
    )
  }
}

test('basic step', async (t) => {
  const logs = await new StateTestPort({log: t.log}).run(null).pipe(toArray()).toPromise();
  t.log(JSON.stringify(logs, undefined, 2));
  t.pass();
})
