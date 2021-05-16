import {merge, of} from "rxjs";
import {scan, switchMap} from "rxjs/operators";
import {source, sink, Socket, directProc} from '@pkit/core'
import {patch, PartialState} from './processors'

export * from './processors'

export class StateLegacyPort<T> {
  init = new Socket<T>();
  update = new Socket<PartialState<T>>();
  data = new Socket<T>();

  circuit () {
    const port = this;
    return directProc(source(port.init).pipe(
      switchMap((initial) =>
        merge(
          source(port.update).pipe(
            scan((acc, curr) =>
              patch(curr, JSON.parse(JSON.stringify(acc))), initial)),
          of(initial)
        ))),
      sink(port.data));
  }
}
