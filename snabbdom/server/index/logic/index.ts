import 'snabbdom-to-html'
import init from 'snabbdom-to-html/init'
import {ForcePublicPort, IKit, mapProc, mergeParamsPrototypeKit, sink, source} from "@pkit/core";
import {SnabbdomServerPort} from "../";
import {jsxModule, classNamesModule} from '../../modules/'

const toHTML = init([jsxModule, classNamesModule]);

export type ISnabbdomServerPort = ForcePublicPort<SnabbdomServerPort>;

const renderKit: IKit<ISnabbdomServerPort> = (port, {fragment} = {fragment: true}) =>
  mapProc(source(port.render), sink(port.html),
    (vnode) => (fragment ? '<!DOCTYPE html>' : '') + toHTML(vnode))

export namespace ISnabbdomServerPort {
  export const prototype = {renderKit}
  export const circuit = (port: ISnabbdomServerPort) =>
    mergeParamsPrototypeKit(port, prototype)
}