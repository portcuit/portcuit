import {merge} from "rxjs";
import {Socket} from "../../../core/";
import {SpaState} from "../../shared/state";
import {SpaServerPort} from "../index/";
import {ISpaServerApiLogicPort} from "./logic/";

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