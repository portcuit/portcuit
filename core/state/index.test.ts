import {LifecyclePort} from "../lifecycle/";
import {merge} from "rxjs";
import {sink, source} from "../core/";
import {filter, switchMap, take, takeUntil, tap, toArray} from "rxjs/operators";
import {mapProc, mapToProc, ofProc} from "../processors";
import {StatePort, FlowState, StateFlow, initialStateFlow, finishFlow, isFinishFlow, singlePatch} from "./";

type StateTestState = {
  talkId?: string;
  talk?: {
    talentId: number;
  };
  flow: {
    findTalk: StateFlow;
  };
} & FlowState

const initialState = (): StateTestState =>
  ({
    talk: {
      talentId: 1
    },
    flow: {
      init: initialStateFlow(),
      findTalk: initialStateFlow()
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
          ofProc(sink(port.state.init), [initialState()]),

          mapToProc(source(port.state.data), sink(port.state.update),
            singlePatch({talkId: '5'})),

          mapToProc(source(port.state.data).pipe(
            filter(isFinishFlow('init'))),
            sink(port.state.update), [
              [{
                talkId: '3',
                talk: {talentId: 3}
              }],
              finishFlow('findTalk')
            ]),

          mapToProc(source(port.state.data).pipe(
            filter(isFinishFlow('findTalk'))),
            sink(port.terminated))
        ).pipe(takeUntil(source(port.terminated)))))
    )
  }
}

test('test', async () => {
  const logs = await new StateTestPort().stream(null).pipe(toArray()).toPromise();
  console.log(JSON.stringify(logs, undefined, 2));
})

