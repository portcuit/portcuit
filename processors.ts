import {Observable} from "rxjs";
import {map} from "rxjs/operators";
import {DeepPartial, Sink} from "pkit/core";
import {Action, ActionDetail} from "./modules/action";

export const actionProc = <T>(source$: Observable<ActionDetail>, sink: Sink<DeepPartial<T>>) =>
  source$.pipe(
    map(({fn, data}) =>
      sink(new Function(`return ${fn};`)()(data))))

export const createAction = <T>(action: Action<T>) =>
  Object.entries(action).reduce((acc, [key, value]) =>
    ({...acc,
      [key]: value!.toString()
    }), {})
