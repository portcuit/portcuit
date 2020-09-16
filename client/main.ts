import EventTarget from '@ungap/event-target'
import {mount} from "pkit";
import {ScreenParams, ScreenPort, screenKit} from './screen/';
import {CreateCsr} from "./vm";

export const main = (createCsr: CreateCsr<any>) => {
  if (globalThis.document) {
    const state = JSON.parse(document.querySelector('#state')!.textContent!);
    const params: ScreenParams = {
      worker: {
        ctor: Worker,
        args: [`${state.esmAppRoot}/main.js`, {type: 'module'}]
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

