import {LifecyclePort, Socket} from "@pkit/core";
import {UpdateBatch} from '@pkit/state'
import {ISpaClientBffLogicPort} from "./mixins/logic";

export class SpaClientBffPort extends LifecyclePort {
  init = new Socket<{endpoint: string}>();
  update = new Socket<UpdateBatch<any>>();
  batch = new Socket<UpdateBatch<any>>()

  circuit () {
    return ISpaClientBffLogicPort.flow({...ISpaClientBffLogicPort.prototype, ...this});
  }
}

