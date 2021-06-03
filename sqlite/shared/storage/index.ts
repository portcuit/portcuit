import {merge, Observable} from "rxjs";
import {EndpointPort, Port, mapToProc, PortMessage, sink, Socket, source} from "@pkit/core";

export abstract class SqliteStoragePort extends Port {
  init = new Socket<{sqlite: string, saveOnCommand?: boolean}>();
  load = new EndpointPort<void, Uint8Array>();
  save = new EndpointPort<Uint8Array, void>();

  abstract loadKit (port: Pick<this, 'load' | 'init'>): Observable<PortMessage<Uint8Array>>;
  abstract saveKit (port: Pick<this, 'save' | 'init'>): Observable<PortMessage<void>>;

  flow() {
    return merge(
      mapToProc(source(this.init), sink(this.ready)),
      this.loadKit(this),
      this.saveKit(this)
    );
  }

}