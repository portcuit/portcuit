import {mergeMapProc, Port, PortParams, sink, Socket, source} from "@pkit/core";
import {UpdateBatch} from '@pkit/state'

export class SpaClientBffPort extends Port {
  init = new Socket<{endpoint: string}>();
  update = new Socket<UpdateBatch<any>>();
  batch = new Socket<UpdateBatch<any>>()

  postFlow = (port: this, {endpoint}: PortParams<this>) =>
    mergeMapProc(source(port.update), sink(port.batch),
      async (batch) => {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=utf-8'
          },
          body: JSON.stringify(batch)
        });

        return await res.json()
      }, sink(port.err))
}
