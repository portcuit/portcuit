import {Observable} from "rxjs";
import {map} from "rxjs/operators";
import {DeepPartial, Sink, ReplaceObject, ReplaceArray, EphemeralBoolean, EphemeralContainer, splice, padArray} from "pkit";
import {Action, ActionDetail} from "./modules/action";

const pkit = {ReplaceObject, ReplaceArray, EphemeralBoolean, EphemeralContainer, splice, padArray}

export const actionProc = <T>(source$: Observable<ActionDetail>, sink: Sink<DeepPartial<T>>) =>
  source$.pipe(
    map(([fn, data]) =>
      sink(new Function(`return ({ReplaceObject, ReplaceArray, EphemeralBoolean, EphemeralContainer, splice, padArray, pkit}) => ${fn};`)()
      ({...pkit, pkit})(data))))

export const action = <T, U = undefined>(action: Action<T,U>, detail?: U) =>
  [Object.entries(action).reduce((acc, [key, value]) =>
    ({...acc,
      [key]: value!.toString()
    }), {}), detail]
