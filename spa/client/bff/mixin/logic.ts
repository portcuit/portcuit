import {
  ForcePublicPort,
  IFlow,
  mergeMapProc,
  mergeParamsPrototypeKit,
  sink,
  source
} from "@pkit/core";
import {SpaClientBffPort} from "../";

type ISpaClientBffLogicPort = ForcePublicPort<SpaClientBffPort>
type Kit = IFlow<ISpaClientBffLogicPort>

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

export namespace ISpaClientBffLogicPort {
  export const prototype = {
    postKit
  };
  export const circuit = (port: ISpaClientBffLogicPort) =>
    mergeParamsPrototypeKit(port, prototype)
}
