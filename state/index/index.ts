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
      scan(([prevData], patches) => [
        patches.reduce((acc, patch) =>
          mergePatch.apply(acc, patch), json8.clone(prevData)),
        patches, prevData
      ] as StateData<T>, [initial, [] as any, {}] as StateData<T>),
      startWith([initial, [], {} as any] as StateData<T>)),
      sink(port.data))
}
