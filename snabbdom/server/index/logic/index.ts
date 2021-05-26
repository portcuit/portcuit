import 'snabbdom-to-html'
import init from 'snabbdom-to-html/init'
import {ForcePublicPort, IFlow, mapProc, mergeParamsPrototypeKit, ofProc, sink, source} from "@pkit/core";
import {SnabbdomServerPort} from "../";
import {jsxModule, classNamesModule} from '../modules/'

export type ISnabbdomServerPort = ForcePublicPort<SnabbdomServerPort>;
type Kit = IFlow<ISnabbdomServerPort>

const renderKit: Kit = (port, {fragment} = {fragment: true}) => {
  const toHTML = init([jsxModule, classNamesModule]);
  return mapProc(source(port.render), sink(port.html),
    (vnode) => (fragment ? '<!DOCTYPE html>' : '') + toHTML(vnode))
}

const readyKit: Kit = (port) =>
  ofProc(sink(port.ready))

export namespace ISnabbdomServerPort {
  export const prototype = {
    renderKit,
    readyKit
  }
  export const circuit = (port: ISnabbdomServerPort) =>
    mergeParamsPrototypeKit(port, prototype)
}