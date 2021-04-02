import {merge, Observable} from "rxjs";
import {EndpointPort, LifecyclePort, mapToProc, PortMessage, sink, Socket, source} from "@pkit/core";

export abstract class SqliteStoragePort extends LifecyclePort {
  init = new Socket<{sqlite: string, saveOnCommand?: boolean}>();
  load = new EndpointPort<void, Uint8Array>();
  save = new EndpointPort<Uint8Array, void>();

  abstract loadKit (port: Pick<this, 'load' | 'init'>): Observable<PortMessage<Uint8Array>>;
  abstract saveKit (port: Pick<this, 'save' | 'init'>): Observable<PortMessage<void>>;

  circuit() {
    return merge(
      mapToProc(source(this.init), sink(this.ready)),
      this.loadKit(this),
      this.saveKit(this)
    );
  }

}