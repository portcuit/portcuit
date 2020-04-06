import {Module} from 'snabbdom/modules/module'
import {ns2path, NsPath} from 'pkit/core'
import {ActionPath, Events} from 'pkit/ui/compute'

export const statePath2actionStatePath = (statePath: NsPath) =>
  statePath.reduce((acc,token) =>
    [token, acc], []);

export default (emitter, eventName, portPrefixPath=[]): Module => {
  const createOrUpdate = (oldVnode, vnode) => {
    if (!('data' in vnode)) return;
    if (!('action' in vnode.data)) return;
    if (!vnode.data.action) return;
    const [events, actionPath]: [Events, ActionPath] = vnode.data.action;

    vnode.data.on = Object.entries(events).reduce((acc,[domEventName, {port: portNs, state: stateNs}]) => {
      const stateActionPath = statePath2actionStatePath(actionPath.state.concat(ns2path(stateNs)?.[0] ?? []));
      const portPath = actionPath.port.concat(ns2path(portNs)?.[0] ?? []);

      return Object.assign(acc, {
        [domEventName]: ev => {
          emitter.emit(eventName, [[...portPrefixPath, ...portPath, domEventName].join('.'), [ev, stateActionPath]]);
          return;
        }
      })
    }, {})
  };

  return {
    pre: undefined,
    destroy: undefined,
    remove: undefined,
    post: undefined,
    create: createOrUpdate,
    update: createOrUpdate
  }
}
