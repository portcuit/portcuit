import {LifecyclePort} from "../lifecycle/";
import {merge} from "rxjs";
import {sink, source} from "../core/";
import {filter, switchMap, take, takeUntil, tap, toArray} from "rxjs/operators";
import {mapToProc, ofProc} from "../processors";
import {StatePort, finishFlow, FlowState, StateFlow, initialStateFlow} from "./";

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
        switchMap((params) => merge(
          ofProc(sink(port.state.init), initialState()),

          mapToProc(source(port.state.data).pipe(take(1)),
            sink(port.state.update), [
              [{
                talkId: 'abc',
                talk: {talentId: 3}
              }],

              // finishFlow('findTalk'),
            ]),

          mapToProc(source(port.state.data).pipe(
            filter((state) => state?.flow?.findTalk?.finish)),
            sink(port.terminated))
        ).pipe(takeUntil(source(port.terminated)))))
    )
  }
}

test('test', async () => {
  const logs = await new StateTestPort().stream(null).pipe(toArray()).toPromise();
  console.log(JSON.stringify(logs, undefined, 2));
})


