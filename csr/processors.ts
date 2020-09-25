import {Action} from "./modules/action";

type StringAction<T> = T extends Action<infer U, infer V> ?
  {[P in keyof T]: string} : never;

export type BindAction<T, U = undefined> = [StringAction<Action<T, U>>, U]

export const action = <T, U = undefined>(action: Action<T,U>, detail?: U) =>
  [Object.entries(action).reduce((acc, [key, value]) =>
    ({...acc,
      [key]: value!.toString()
    }), {}), detail]
