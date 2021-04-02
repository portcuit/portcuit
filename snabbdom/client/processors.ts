import {Action} from "./modules/action";

export const action = <T, U = undefined>(action: Action<T,U>, detail?: U) =>
  [Object.entries(action).reduce((acc, [key, value]) =>
    ({...acc,
      [key]: value!.toString()
    }), {}), detail]
