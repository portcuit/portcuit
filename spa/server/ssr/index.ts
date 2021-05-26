import {merge} from "rxjs";
import {PortParams, Socket} from "@pkit/core";
import {SnabbdomServerPort} from "@pkit/snabbdom/server";
import {SpaCsr, SpaState} from "@pkit/spa";
import {ISpaServerVdomPort} from "../index/";
import {SpaServerApiPort} from "../api/";
import {ISpaServerSsrLogicPort} from "./mixins/logic";

export class SpaServerSsrPort<T extends SpaState> extends SpaServerApiPort<T> {
  init = new Socket<{params: {csr: SpaCsr}} & PortParams<SpaServerApiPort<T>>>();
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
