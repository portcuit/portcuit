import {LifecyclePort} from "../lifecycle/";
import {merge} from "rxjs";
import {sink, source} from "../core/";
import {filter, switchMap, take, takeUntil, tap, toArray} from "rxjs/operators";
import {mapProc, mapToProc, ofProc} from "../processors";
import {StatePort, singlePatch} from './'
import {StepState, finishStep, isFinishStep} from "../flow/";

type StateTestState = {
  talkId?: string;
  talk?: {
    talentId: number;
  };
  flow: {
    init: StepState;
    findTalk: StepState;
  };
}

const initialState = (): StateTestState =>
  ({
    talk: {
      talentId: 1
    },
    flow: {
      init: StepState.initialState(),
      findTalk: StepState.initialState()
    }
  });

class StateTestPort extends LifecyclePort {
  state = new StatePort<StateTestState>()

  circuit() {
    const port = this;
    return merge(
      port.state.circuit(),
      source(port.init).pipe(
        switchMap(() => merge(
          ofProc(sink(port.state.init), initialState()),

          mapToProc(source(port.state.data), sink(port.state.update),
            singlePatch({talkId: '5'})),

          mapToProc(source(port.state.data).pipe(
            filter(isFinishStep('init'))),
            sink(port.state.update), [
              [{
                talkId: '3',
                talk: {talentId: 3}
              }],
              finishStep('findTalk')
            ]),

          mapToProc(source(port.state.data).pipe(
            filter(isFinishStep('findTalk'))),
            sink(port.terminated))
        ).pipe(takeUntil(source(port.terminated)))))
    )
  }
}

test('test', async () => {
  const logs = await new StateTestPort().run(null).pipe(toArray()).toPromise();
  console.log(JSON.stringify(logs, undefined, 2));
})


