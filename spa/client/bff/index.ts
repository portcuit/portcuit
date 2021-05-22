import {EndpointPort, LifecyclePort, Socket, UpdateBatch} from "@pkit/core";
import {ISpaClientBffLogicPort} from "./mixin/logic";

export class SpaClientBffPort extends LifecyclePort {
  init = new Socket<{endpoint: string}>();
  update = new EndpointPort<UpdateBatch<any>, UpdateBatch<any>>();

  circuit () {
    const port =  this;
    return ISpaClientBffLogicPort.circuit(port);
  }
}
Object.assign(SpaClientBffPort.prototype, ISpaClientBffLogicPort.prototype);

