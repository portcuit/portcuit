import 'snabbdom-to-html'
import init from 'snabbdom-to-html/init'
import {
  cycleFlow,
  IFlow, IPort,
  mapProc,
  ofProc,
  replaceProperty,
  sink,
  source
} from "@pkit/core";
import {SnabbdomServerPort} from "../";
import {jsxModule, classNamesModule} from '../modules/'

type ISnabbdomServerLogicPort = IPort<SnabbdomServerPort>;
type Flow = IFlow<ISnabbdomServerLogicPort>

const renderFlow: Flow = (port, {fragment} = {fragment: true}) => {
  const toHTML = init([jsxModule, classNamesModule]);
  return mapProc(source(port.render), sink(port.html),
    (vnode) => (fragment ? '<!DOCTYPE html>' : '') + toHTML(vnode))
}

const readyFlow: Flow = (port) =>
  ofProc(sink(port.ready))

export namespace ISnabbdomServerLogicPort {
  export const prototype = {
    renderFlow,
    readyFlow
  }
  export const flow = (port: ISnabbdomServerLogicPort) =>
    cycleFlow(port, 'init', 'terminated', prototype)
}