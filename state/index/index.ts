import json8 from 'json8'
import mergePatch from 'json8-merge-patch'
import {map, scan, startWith} from "rxjs/operators";
import {sink, Socket, source, directProc, Port} from "@pkit/core";
import {UpdateBatch, StateData} from './lib'

export * from './lib'

export class StatePort<T extends {}> extends Port {
  init = new Socket<T>();
  update = new Socket<UpdateBatch<T>>();
  data = new Socket<StateData<T>>();

  patchFlow = (port: StatePort<T>, initial: T) =>
    directProc(source(port.update).pipe(
      map((batch) => {
        const patches = []
        const postPathces = []
        for (const pair of batch) {
          patches.push(pair[0])
          if (pair[1]) {postPathces.push(pair[1])}
        }
        return [patches, postPathces] as const;
      }),
      scan(([, prevData], [patches, postPatches]) => {
        const data = patches.reduce((acc, patch) =>
          mergePatch.apply(acc, patch), json8.clone(prevData))

        const prePatch = patches.reduce((acc, patch) =>
          mergePatch.apply(acc, patch), {})

        const postData = postPatches.reduce((acc, patch) =>
          mergePatch.apply(acc, patch), json8.clone(data))

        const postPatch = postPatches.reduce((acc, patch) =>
          mergePatch.apply(acc, patch), {})

        return [data, postData, prevData, prePatch, postPatch] as StateData<T>
      }, [{}, initial, initial, {}, {}] as StateData<T>),
      startWith([initial, initial, initial, {}, {}] as StateData<T>)),
      sink(port.data))
}
