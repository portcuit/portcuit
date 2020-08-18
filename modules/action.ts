import type {Module} from 'snabbdom/modules/module'
import type {VNode} from 'snabbdom/vnode'
import {DeepPartial} from "pkit";

type ClonedEvent<T=any> = {
  clientX: number;
  clientY: number;
  key: string;
  currentTarget: {
    value: string;
    checked: boolean;
    dataset: {
      [key: string]: string;
      json: any;
    }
  }
}

export type ActionHandler<T> = (ev: ActionEvent) =>
  (data: ClonedEvent) => DeepPartial<T> | undefined;

export type Action<T> = {
  [P in keyof HTMLElementEventMap]?: ActionHandler<T>
}

export type ClonedAction = {
  [P in keyof HTMLElementEventMap]?: string
}

export type ActionDetail = {
  fn: string;
  data: ClonedEvent;
}

type ActionEvent = UIEvent & InputEvent & MouseEvent & KeyboardEvent & {
  currentTarget: {
    value: string;
    checked: boolean;
    dataset: {
      json?: string
    };
  }
}

export const createActionModule = (target: EventTarget): Module => {
  const createOrUpdate = (oldVnode: VNode, vnode: VNode) => {
    if (!vnode.data) return;
    if (!vnode.data.action) return;
    const action: ClonedAction = vnode.data.action;
    vnode.data.on = vnode.data.on || {}

    Object.entries(action)
      .reduce((acc, [key, value]) =>
          Object.assign(acc, {
            [key]: (ev: ActionEvent) => {
              const fn = new Function(`return ${value};`)()(ev);
              if (fn !== undefined) {
                target.dispatchEvent(new CustomEvent<ActionDetail>('action', {
                  detail: {
                    fn: fn.toString(),
                    data: cloneEvent(ev)
                  }
                }))
              }
            }
          }), vnode.data.on)
  }

  return {
    create: createOrUpdate,
    update: createOrUpdate
  }
}

const cloneEvent = (ev: ActionEvent) => ({
  clientX: ev.clientX,
  clientY: ev.clientY,
  key: ev.key,
  currentTarget: {
    value: ev.currentTarget.value,
    checked: ev.currentTarget.checked,
    dataset: {...ev.currentTarget.dataset,
      json: JSON.parse(ev.currentTarget.dataset.json || 'null')
    }
  }
})
