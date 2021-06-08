import {Observable} from "rxjs";
import {EndpointPort, Port, PortMessage, sink, Socket, ofProc, PortParams} from "@pkit/core";

export abstract class SqliteStoragePort extends Port {
  init = new Socket<{sqlite: string, saveOnCommand?: boolean}>();
  load = new EndpointPort<void, Uint8Array>()
  save = new EndpointPort<Uint8Array, void>()

  abstract loadFlow (port: this, params: PortParams<this>): Observable<PortMessage<Uint8Array>>
  abstract saveFlow (port: this, params: PortParams<this>): Observable<PortMessage<void>>

  readyFlow = (port: this) =>
    ofProc(sink(port.ready))
}