import {merge} from "rxjs";
import {filter} from 'rxjs/operators'
import {directProc, mapToProc, ofProc, Port, PortParams, sink, Socket, source} from "@pkit/core";
import {SnabbdomServerPort} from "@pkit/snabbdom/server";
import {SpaCsr, SpaState} from "@pkit/spa";
import {SpaBackendBffPort} from "../bff";
import {startStep, UpdateBatch} from "@pkit/state";

export class SpaBackendSsrPort<T extends SpaState> extends SpaBackendBffPort<T> {
  init = new Socket<{params: {csr: SpaCsr}} & PortParams<SpaBackendBffPort<T>>>();
  vdom = new SnabbdomServerPort;
  html = new Socket<string>()

  initVdomFlow = (port: this) =>
    ofProc(sink(port.vdom.init))

  vdomHtmlFlow = (port: this) =>
    directProc(source(port.vdom.html), sink(port.html))

  startRenderFlow = (port: this, {ctx: [{method}]}: PortParams<this>) =>
    mapToProc(source(port.state.init).pipe(
      filter(() =>
        method === 'GET')),
      sink<UpdateBatch<SpaState>>(port.state.update),
      [startStep('render')])

  respondHtmlFlow = (port: this) =>
    directProc(source(port.html), sink(port.rest.response.html))

  flow () {
    return merge(
      super.flow(),
      this.vdom.flow(),
    )
  }
}
