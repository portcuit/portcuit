import {Action} from "./modules/action";

export const action = <T, U = undefined>(action: Action<T,U>, detail?: U) =>
  [
    Object.fromEntries(Object.entries(action)
      .map(([key, value]) =>
        [key, value!.toString()])),
    detail
  ]
