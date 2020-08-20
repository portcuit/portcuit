import {Observable} from "rxjs";
import {map} from "rxjs/operators";
import {DeepPartial, Sink} from "pkit/core";
import {Action, ActionDetail} from "./modules/action";
import {ReplaceObject, ReplaceArray, EphemeralBoolean, splice} from 'pkit/state'

export const actionProc = <T>(source$: Observable<ActionDetail>, sink: Sink<DeepPartial<T>>) =>
  source$.pipe(
    map(([fn, data]) =>
      sink(new Function(`return ({ReplaceObject, ReplaceArray, EphemeralBoolean, splice}) => ${fn};`)()
      ({ReplaceObject, ReplaceArray, EphemeralBoolean, splice})(data))))

export const action = <T, U = undefined>(action: Action<T,U>, detail?: U) =>
  [Object.entries(action).reduce((acc, [key, value]) =>
    ({...acc,
      [key]: value!.toString()
    }), {}), detail]
