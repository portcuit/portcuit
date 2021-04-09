import {IAppServerRenderPort} from "../index";
import {IKit, mapProc, mergeParamsPrototypeKit, sink, source} from "@pkit/core";
import {filter} from "rxjs/operators";

const renderPort: IKit<IAppServerRenderPort> = (port, {View}) =>
  mapProc(source(port.state.data).pipe(
    filter(({flag: {render: {start}}}) => start)),
    sink(port.vdom.render),
    (state) => View(state))

export namespace IAppServerRenderLogicPort {
  export const prototype = {renderPort}
  export const circuit = (port: IAppServerRenderPort) =>
    mergeParamsPrototypeKit(port, prototype)
}
