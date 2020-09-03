import {Observable} from "rxjs";
import {map} from "rxjs/operators";
import {DeepPartial, Sink, ReplaceObject, ReplaceArray, EphemeralBoolean, splice, padArray} from "pkit";
import {Action, ActionDetail} from "./modules/action";

export const actionProc = <T>(source$: Observable<ActionDetail>, sink: Sink<DeepPartial<T>>) =>
  source$.pipe(
    map(([fn, data]) =>
      sink(new Function(`return ({ReplaceObject, ReplaceArray, EphemeralBoolean, splice, padArray, pkit}) => ${fn};`)()
      ({ReplaceObject, ReplaceArray, EphemeralBoolean, splice, padArray, pkit: {ReplaceObject, ReplaceArray, EphemeralBoolean, splice, padArray}})(data))))

export const action = <T, U = undefined>(action: Action<T,U>, detail?: U) =>
  [Object.entries(action).reduce((acc, [key, value]) =>
    ({...acc,
      [key]: value!.toString()
    }), {}), detail]
