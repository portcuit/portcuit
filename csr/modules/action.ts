import type {Module} from 'snabbdom/modules/module'
import type {VNode} from 'snabbdom/vnode'
import type {DeepPartial} from "pkit";

type ClonedEvent<T=any> = {
  clientX: number;
  clientY: number;
  key: string;
  code: string;
  detail: T;
  currentTarget: {
    value: string;
    checked: boolean;
    dataset: {
      [key: string]: string | undefined;
    }
  }
}

export type ActionHandler<T,U=any> = (ev: ActionEvent) =>
  | undefined
  | ((data: ClonedEvent<U>) => undefined | DeepPartial<T>)

export type Action<T,U=any> = {
  [P in keyof HTMLElementEventMap]?: ActionHandler<T,U>
}

export type ClonedAction = {
  [P in keyof HTMLElementEventMap]?: string
}

export type ActionDetail = [fn: string, data: ClonedEvent]

type ActionEvent = UIEvent & InputEvent & MouseEvent & KeyboardEvent & {
  currentTarget:  HTMLElement & HTMLInputElement
}

export const createActionModule = (target: EventTarget): Module => {
  const createOrUpdate = (oldVnode: VNode, vnode: VNode) => {
    if (!vnode.data) return;
    if (!vnode.data.bind) return;

    const [action, detail]: [ClonedAction, any] = vnode.data.bind;
    (vnode.elm as HTMLElement).dataset.detail = JSON.stringify(detail || null);

    vnode.data.on ||= {}
    Object.entries(action)
      .reduce((acc, [key, value]) =>
          Object.assign(acc, {
            [key]: (ev: ActionEvent) => {
              const fn = new Function(`return ${value};`)()(ev);
              if (fn !== undefined) {
                target.dispatchEvent(new CustomEvent<ActionDetail>('action', {
                  detail: [fn.toString(), cloneEvent(ev)]
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

const cloneEvent = (ev: ActionEvent): ClonedEvent => ({
  detail: JSON.parse(ev.currentTarget.dataset.detail || 'null'),
  clientX: ev.clientX,
  clientY: ev.clientY,
  key: ev.key,
  code: ev.code,
  currentTarget: {
    value: ev.currentTarget.value,
    checked: ev.currentTarget.checked,
    dataset: {...ev.currentTarget.dataset}
  }
})
