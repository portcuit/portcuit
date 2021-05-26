import {merge} from "rxjs";
import {PortParams, Socket} from "@pkit/core";
import {SnabbdomServerPort} from "@pkit/snabbdom/server";
import {SpaCsr, SpaState} from "../../shared/";
import {ISpaServerVdomPort} from "../index/";
import {SpaServerApiPort} from "../api/";
import {ISpaServerSsrLogicPort} from "./mixin/logic";

export class SpaServerSsrPort<T extends SpaState> extends SpaServerApiPort<T> {
  init = new Socket<{
    csr: SpaCsr
  } & PortParams<SpaServerApiPort<T>>>();
  vdom = new SnabbdomServerPort;
  html = new Socket<string>()

  circuit() {
    const port = this;
    return merge(
      port.vdom.circuit(),
      super.circuit(),
      ISpaServerVdomPort.circuit(port),
      ISpaServerSsrLogicPort.circuit(port)
    )
  }
}
Object.assign(SpaServerSsrPort.prototype, ISpaServerVdomPort.prototype);
Object.assign(SpaServerSsrPort.prototype, ISpaServerSsrLogicPort.prototype);