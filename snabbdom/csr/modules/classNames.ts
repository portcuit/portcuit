import { VNode, VNodeData } from 'snabbdom/vnode'
import { Module } from 'snabbdom/modules/module'
import {difference} from "ramda";

type ClassNames = {[key: string]: boolean}

function updateClass (oldVnode: VNode, vnode: VNode): void {
  if (!vnode || !vnode.data || !vnode.data.classNames) return;
  const elm: Element = vnode.elm as Element
  const classNames: ClassNames = vnode.data.classNames;

  const filterClassNames = (classNames: ClassNames, cond: (...args: any[]) => boolean) =>
    Object.entries(classNames).filter(cond)
      .reduce((acc, [key]) => [...acc, key], [] as string[])

  const existing = Array.from(elm.classList);
  const remove = filterClassNames(classNames, ([,value]) => !value);
  const add = filterClassNames(classNames, ([,value]) => !!value);

  elm.className = [...difference(existing, remove), ...difference(add, existing)].join(' ')
}

export const classNamesModule: Module = { create: updateClass, update: updateClass }
