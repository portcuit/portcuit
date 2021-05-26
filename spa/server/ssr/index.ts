import {merge} from "rxjs";
import {PortParams, Socket} from "@pkit/core";
import {SnabbdomServerPort} from "@pkit/snabbdom/server";
import {SpaCsr, SpaState} from "@pkit/spa";
import {ISpaServerVdomPort} from "../index/";
import {SpaServerBffPort} from "../bff/";
import {ISpaServerSsrLogicPort} from "./mixins/logic";

export class SpaServerSsrPort<T extends SpaState> extends SpaServerBffPort<T> {
  init = new Socket<{params: {csr: SpaCsr}} & PortParams<SpaServerBffPort<T>>>();
  vdom = new SnabbdomServerPort;
  html = new Socket<string>()

  circuit() {
    const port = this;
    return merge(
      port.vdom.circuit(),
      super.circuit(),
      ISpaServerVdomPort.flow({...ISpaServerVdomPort.prototype, ...port}),
      ISpaServerSsrLogicPort.circuit({...ISpaServerSsrLogicPort.prototype, ...port})
    )
  }
}
