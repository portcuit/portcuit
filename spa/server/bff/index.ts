import {merge} from "rxjs";
import {Socket} from "@pkit/core";
import {SpaState} from '@pkit/spa'
import {UpdateBatch} from "@pkit/state";
import {SpaServerPort} from "../index/";
import {ISpaServerBffLogicPort} from "./mixins/logic";

export class SpaServerBffPort<T extends SpaState> extends SpaServerPort<T> {
  bff = {
    update: new Socket<UpdateBatch<T>>()
  }

  flow() {
    return merge(
      super.flow(),
      ISpaServerBffLogicPort.flow(this)
    );
  }
}
