import EventTarget from '@ungap/event-target'
import type {NextCsrState} from "../";
import {ScreenPort} from './screen/';
import {CreateCsr} from "./vm";

export const main = <T>(createCsr: CreateCsr<T>) => {
  if (globalThis.document) {
    const state: NextCsrState = JSON.parse(document.querySelector('#state')!.textContent!);
    return new ScreenPort().stream({
      worker: {
        ctor: Worker,
        args: [`${state.csr.docRoot}${state.csr.entrypoint}`, {type: 'module'}]
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
    }).toPromise();
  } else {
    // return mount(createCsr());
  }
}

