import {difference} from 'ramda'
import {Module} from "snabbdom-to-html-common";

type ClassNames = {[key: string]: boolean}

export const classNamesModule: Module = (vnode, attributes) => {
  if (!vnode || !vnode.data || !vnode.data.classNames) return;
  const classNames: ClassNames = vnode.data.classNames;
  const existing = `${attributes.get('class') || ''}`.split(' ')

  const filterClassNames = (classNames: ClassNames, cond: (...args: any[]) => boolean) =>
    Object.entries(classNames).filter(cond)
      .reduce((acc, [key]) => [...acc, key], [] as string[])

  const remove = filterClassNames(classNames, ([,value]) => !value);
  const add = filterClassNames(classNames, ([,value]) => !!value);
  attributes.set('class', [...difference(existing, remove), ...difference(add, existing)].join(' '))
}
