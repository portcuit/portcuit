import EventTarget from '@ungap/event-target'
import {mount} from "pkit";
import {ScreenParams, ScreenPort, screenKit} from './screen/';
import {CreateCsr} from "./vm";
import type {IState} from "../";

export const main = <T>(createCsr: CreateCsr<T>) => {
  if (globalThis.document) {
    const state = JSON.parse(document.querySelector('#state')!.textContent!) as IState;
    const params: ScreenParams = {
      worker: {
        ctor: Worker,
        args: [state.ssr!.entryPoint, {type: 'module'}]
      },
      snabbdom: {
        container: document.body,
        target: new EventTarget,
        options: {
          window,
          hashchange: true
        }
      },
      state
    }
    return mount({Port: ScreenPort, circuit: screenKit, params});
  } else {
    return mount(createCsr());
  }
}

