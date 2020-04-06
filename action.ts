import {Module} from 'snabbdom/modules/module'

export default (emitter, eventName, portNs=[]): Module => {
  const createOrUpdate = (oldVnode, vnode) => {
    if (!('data' in vnode)) return;
    if (!('action' in vnode.data)) return;
    if (!vnode.data.action) return;

    const [action, [statePath, portPath]]: [{}, [any[], any[]]] = vnode.data.action;

    vnode.data.on = Object.entries(action).reduce((acc, [domEventName, scope]) =>
      Object.assign(acc, {
        [domEventName]: ev =>
          (emitter.emit(eventName, [
            [...portNs, ...portPath, scope, domEventName].join('.'),
            [ev, statePath]
          ]), undefined)
      }), {})
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

export interface ActionVNodeData {
  actions: string[][];
  idxs: number[];
  data: any;
}

type Idxs = number[]
type Data = any
export type ActionData = [Event, Idxs, Data]
