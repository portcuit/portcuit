import {ForcePublicPort, IKit, mapToProc, mergeParamsPrototypeKit, ofProc, sink, source} from "../../../../core";
import {SpaState} from "../../../shared/state";
import {SpaPort} from "../";

type ISpaServerRestPort = ForcePublicPort<Omit<SpaPort<SpaState> ,'circuit'>>;
type Kit = IKit<ISpaServerRestPort>;

// const initStateRestKit: Kit = (port, {ctx: [{method, headers}], state}) =>　{
//   switch (true) {
//     case method === 'GET':
//       return mapProc(zip(source(port.rest.ready), source(port.vdom.ready)).pipe(take(1)),
//         sink(port.state.init),
//         () => tuple(state, [startFlow('render')]));
//     // TODO: updateBatchの内容によってはエラーになる場合もある。簡単にチェックするか？
//     case method === 'POST' && `${headers['content-type']}`.startsWith('application/json'):
//       return mapProc(zip(source(port.rest.request.body.json), source(port.vdom.ready)).pipe(take(1)),
//         sink(port.state.init),
//         ([updateBatch]) => tuple(state, [...updateBatch, startFlow('api')]))
//     default:
//       return ofProc(sink(port.rest.response.raw),
//         new HttpServerRestResponse(JSON.stringify({
//           status: 400,
//           title: 'Bad Request',
//           detail: `You must specify application/json at content-type headers when you post request.`
//         }), {
//           status: 400,
//           headers: {
//             'Content-Type': 'application/problem+json; charset=utf-8'
//           }
//         }))
//   }
// }

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
