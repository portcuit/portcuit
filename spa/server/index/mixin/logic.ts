import {ForcePublicPort, IKit, mergeParamsPrototypeKit, ofProc, sink} from "@pkit/core";
import {SpaServerPort} from "../";
import {SpaState} from "../../../shared/";

type ISpaServerLogicPort = ForcePublicPort<Omit<SpaServerPort<SpaState>, 'circuit'>>
type Kit = IKit<ISpaServerLogicPort>

const initStateKit: Kit = (port, {state}) =>
  ofProc(sink(port.state.init), state);

export namespace ISpaServerLogicPort {
  export const prototype = {
    initStateKit
  }
  export const circuit = (port: ISpaServerLogicPort) =>
    mergeParamsPrototypeKit(port, prototype)
}
