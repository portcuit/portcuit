import {merge} from "rxjs";
import {Socket} from "../../../core";
import {SnabbdomServerPort} from "../../../snabbdom/server";
import {SpaState} from "../../shared/state";
import {ISpaVdomPort} from "../index/vdom/";
import {SpaApiPort} from "../api/";
import {ISpaSsrPort} from "./logic/";

export class SpaSsrPort<T extends SpaState> extends SpaApiPort<T> {
  vdom = new SnabbdomServerPort;
  html = new Socket<string>()

  circuit() {
    const port = this;
    return merge(
      port.vdom.circuit(),
      super.circuit(),
      ISpaVdomPort.circuit(port),
      ISpaSsrPort.circuit(port)
    )
  }
}
Object.assign(SpaSsrPort.prototype, ISpaVdomPort.prototype);
Object.assign(SpaSsrPort.prototype, ISpaSsrPort.prototype);