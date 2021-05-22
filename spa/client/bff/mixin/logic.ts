import {
  ForcePublicPort,
  IKit,
  mergeMapProc,
  mergeParamsPrototypeKit,
  sink,
  source
} from "@pkit/core";
import {SpaClientBffPort} from "../";

type SpaClientBffLogicPort = ForcePublicPort<SpaClientBffPort>
type Kit = IKit<SpaClientBffLogicPort>

const postKit: Kit = (port, {endpoint}) =>
  mergeMapProc(source(port.update.req), sink(port.update.res),
    async (batch) => {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify(batch)
      });

      return await res.json()
    }, sink(port.err));

export namespace SpaClientBffLogicPort {
  export const prototype = {
    postKit
  };
  export const circuit = (port: SpaClientBffLogicPort) =>
    mergeParamsPrototypeKit(port, prototype)
}
