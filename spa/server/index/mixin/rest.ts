import {ForcePublicPort, IKit, mapToProc, mergeParamsPrototypeKit, ofProc, sink, source} from "@pkit/core";
import {SpaState} from "../../../shared/";
import {SpaServerPort} from "../";

type ISpaServerRestPort = ForcePublicPort<Omit<SpaServerPort<SpaState> ,'circuit'>>;
type Kit = IKit<ISpaServerRestPort>;

const initRestKit: Kit = (port, {ctx}) =>
  ofProc(sink(port.rest.init), ctx);

const terminateKit: Kit = (port) =>
  mapToProc(source(port.rest.terminated), sink(port.terminated))

export namespace ISpaServerRestPort {
  export const prototype = {
    initRestKit,
    terminateKit
  };
  export const circuit = (port: ISpaServerRestPort) =>
    mergeParamsPrototypeKit(port, prototype)
}
