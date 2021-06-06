import {EndpointPort, mergeMapProc, Port, sink, Socket, source} from "@pkit/core";
import {shell} from "electron";

export class ElectronShellPort extends Port {
  init = new Socket<void>();
  openExternal = new EndpointPort<Parameters<typeof shell.openExternal>, void>()

  openExternalFlow = (port: this) =>
    mergeMapProc(source(port.openExternal.req), sink(port.openExternal.res),
      async (args) =>
        await shell.openExternal(...args))
}
