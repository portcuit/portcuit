import {merge} from "rxjs";
import {Socket} from "../../../core/";
import {SpaState} from "../../shared/state";
import {SpaPort} from "../index/";
import {ISpaApiLogicPort} from "./logic/";

export class SpaApiPort<T extends SpaState> extends SpaPort<T> {
  updateBatch = new Socket<object>();

  circuit() {
    const port = this;
    return merge(
      super.circuit(),
      ISpaApiLogicPort.circuit(port)
    );
  }
}
Object.assign(SpaApiPort.prototype, ISpaApiLogicPort.prototype);