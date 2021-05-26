import {merge} from "rxjs";
import {SpaState} from '../../shared/'
import {SpaServerPort} from "../index/";
import {ISpaServerBffLogicPort} from "./mixins/logic";

export class SpaServerBffPort<T extends SpaState> extends SpaServerPort<T> {
  circuit() {
    const port = this;
    return merge(
      super.circuit(),
      ISpaServerBffLogicPort.flow({...ISpaServerBffLogicPort.prototype, ...port})
    );
  }
}
