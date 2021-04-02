import {merge, Observable} from "rxjs";
import {
  decodePatch,
  directProc, encodePatch, EphemeralBoolean,
  ForcePublicPort, latestMergeMapProc,
  LifecyclePort, mapProc, mergePrototypeKit,
  PatchPort,
  PortMessage,
  PortParams, sink,
  Socket, source,
  StatePort
} from "@pkit/core";
import {NextCsrState} from "@pkit/next";
import {VNode} from "snabbdom/jsx-global";
import {SnabbdomClientPort} from "@pkit/snabbdom/client/";
import {filter} from "rxjs/operators";

export abstract class NextClientSsrApiPort<T extends NextCsrState> extends LifecyclePort {
  init = new Socket<{
    snabbdom: PortParams<SnabbdomClientPort>;
    state: T;
  }>();
  vdom = new SnabbdomClientPort;
  state: Omit<StatePort<T>, 'constructor'> = new StatePort<T>();
  patch: Omit<PatchPort<T>, 'constructor'> = new PatchPort<T>();

  abstract renderKit (port: Pick<NextClientSsrApiPort<NextCsrState>, 'vdom' | 'state'>): Observable<PortMessage<VNode>>;

  circuit(): Observable<PortMessage<any>> {
    return merge(
      super.circuit(),
      this.state.circuit(),
      this.vdom.circuit(),
      this.renderKit(this),
      INextClientSsrApiPort.circuit(this)
    )
  }
}

type INextClientSsrApiPort = ForcePublicPort<NextClientSsrApiPort<NextCsrState>>;

const apiKit = (port: INextClientSsrApiPort) =>
  latestMergeMapProc(source(port.patch.decode).pipe(
    filter((encodedPatch) => {
      const patch = decodePatch<NextCsrState>(encodedPatch);
      return !!patch?.req?.externalApi?.valueOf();
    })),
    sink(port.state.update),
    [source(port.state.data)], async ([sendPatch, state]) => {
      // TODO: 例外処理
      const res = await fetch(state.csr.docRoot + state.csr.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify(sendPatch)
      })
      const json = await res.json();

      return decodePatch(json) as any;
    });

const frameKit = (port: INextClientSsrApiPort) =>
  merge(
    directProc(source(port.vdom.action), sink(port.patch.decode)),
    mapProc(source(port.patch.encode), sink(port.patch.decode), encodePatch),
    mapProc(source(port.patch.decode), sink(port.state.update), decodePatch),
  );

const initStateKit = (port: INextClientSsrApiPort) =>
  mapProc(source(port.init), sink(port.state.init), ({state}) =>
    ({...state, res: {init: new EphemeralBoolean(true)}}));

const initSnabbdomKit = (port: INextClientSsrApiPort) =>
  mapProc(source(port.init), sink(port.vdom.init),
    ({snabbdom}) => snabbdom);

namespace INextClientSsrApiPort {
  export const prototype = {apiKit, frameKit, initStateKit, initSnabbdomKit};
  export const circuit = (port: INextClientSsrApiPort) => mergePrototypeKit(port, prototype);
}

Object.assign(NextClientSsrApiPort.prototype, INextClientSsrApiPort.prototype);