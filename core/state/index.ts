import json8 from 'json8'
import mergePatch from 'json8-merge-patch'
import {sink, Socket, source} from "../core/";
import {merge, of} from "rxjs";
import {directProc} from "../processors";
import {map, scan, startWith, switchMap} from "rxjs/operators";

export type StateFlow = {
  start: boolean;
  finish: boolean;
  doing: boolean;
  done: boolean;
}

export type FlowState = {
  flow: {
    init: StateFlow
  }
}

export const initialStateFlow = (): StateFlow =>
  ({
    start: false,
    finish: false,
    doing: false,
    done: false
  });

const actionFlow = (action: keyof StateFlow, prop: string) =>
  [
    {flow: {[prop]: {[action]: true}}},
    {flow: {[prop]: {[action]: false}}}
  ]

export const finishFlow = (prop: string) =>
  [
    {flow: {[prop]: {'finish': true} as const}},
    {flow: {[prop]: {'finish': false} as const}}
  ]

export class StatePort<T extends FlowState> {
  init = new Socket<T>();
  update = new Socket<Partial<T>[][]>();
  data = new Socket<T>();

  circuit () {
    const port = this;
    return directProc(source(port.init).pipe(
      switchMap((initial) =>
        source(port.update).pipe(
          startWith([finishFlow('init')]),
          map((batch) => {
            const pres = [];
            const posts = [];
            for (const patches of batch) {
              pres.push(patches[0]);
              if (patches[1]) { posts.push(patches[1]); }
            }
            return [pres, posts] as const;
          }),
          scan(([, fromData], [pres, posts]) => {
            const data = pres.reduce((acc, patch) =>
              mergePatch.apply(acc, patch), json8.clone(fromData));

            const postData = posts.reduce((acc, patch) =>
              mergePatch.apply(acc, patch), json8.clone(data));

            return [data, postData] as [T, T]
          }, [{}, initial] as [T, T])
        )),
      map(([data]) => data)),
      sink(port.data))
  }
}
