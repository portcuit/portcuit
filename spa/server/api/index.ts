import {merge} from "rxjs";
import {SpaState} from '../../shared/'
import {SpaServerPort} from "../index/";
import {ISpaServerApiLogicPort} from "./mixins/logic";

export class SpaServerApiPort<T extends SpaState> extends SpaServerPort<T> {
  circuit() {
    const port = this;
    return merge(
      super.circuit(),
      ISpaServerApiLogicPort.flow({...ISpaServerApiLogicPort.prototype, ...port})
    );
  }
}
