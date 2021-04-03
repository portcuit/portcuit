import 'snabbdom-to-html'
import init from 'snabbdom-to-html/init'
import {ForcePublicPort, IKit, mapProc, mergeParamsPrototypeKit, sink, source} from "@pkit/core";
import {SnabbdomServerPort} from "../";
import {jsxModule, classNamesModule} from '../../modules/'

export type ISnabbdomServerPort = ForcePublicPort<SnabbdomServerPort>;

const renderKit: IKit<ISnabbdomServerPort> = (port, {fragment} = {fragment: true}) => {
  const toHTML = init([jsxModule, classNamesModule]);
  return mapProc(source(port.render), sink(port.html),
    (vnode) => (fragment ? '<!DOCTYPE html>' : '') + toHTML(vnode))
}

export namespace ISnabbdomServerPort {
  export const prototype = {renderKit}
  export const circuit = (port: ISnabbdomServerPort) =>
    mergeParamsPrototypeKit(port, prototype)
}