import {Port, Socket} from "@pkit/core";
import {UpdateBatch} from '@pkit/state'
import {ISpaClientBffLogicPort} from "./mixins/logic";

export class SpaClientBffPort extends Port {
  init = new Socket<{endpoint: string}>();
  update = new Socket<UpdateBatch<any>>();
  batch = new Socket<UpdateBatch<any>>()

  circuit () {
    return ISpaClientBffLogicPort.flow({...ISpaClientBffLogicPort.prototype, ...this});
  }
}

