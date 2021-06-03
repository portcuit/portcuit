import {
  cycleFlow,
  IFlow, IPort,
  mergeMapProc,
  replaceProperty,
  sink,
  source
} from "@pkit/core";
import {SpaClientBffPort} from "../";

type ISpaClientBffLogicPort = IPort<SpaClientBffPort>
type Flow = IFlow<ISpaClientBffLogicPort>

// TODO: エラークラス作る
const postFlow: Flow = (port, {endpoint}) =>
  mergeMapProc(source(port.update), sink(port.batch),
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
    postFlow
  };
  export const flow = (port: ISpaClientBffLogicPort) =>
    cycleFlow(port, 'init', 'terminated', prototype)
}
