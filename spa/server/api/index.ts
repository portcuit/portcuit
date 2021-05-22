import {merge} from "rxjs";
import {Socket} from "@pkit/core";
import {SpaState} from '../../shared/'
import {SpaServerPort} from "../index/";
import {ISpaServerApiLogicPort} from "./mixin/logic";

export class SpaServerApiPort<T extends SpaState> extends SpaServerPort<T> {
  updateBatch = new Socket<object>();

  circuit() {
    const port = this;
    return merge(
      super.circuit(),
      ISpaServerApiLogicPort.circuit(port)
    );
  }
}
Object.assign(SpaServerApiPort.prototype, ISpaServerApiLogicPort.prototype);