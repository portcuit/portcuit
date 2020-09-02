import type {VNode} from 'snabbdom/vnode'
import remark from 'remark'
import vdom from 'remark-vdom'
import {h} from '@pkit/snabbdom/lib/h'

export * from './pkit'
export * from './fc'

type TemplateRenderer<T=string,U=any> = (strings: TemplateStringsArray, ...args: U[]) => T;

export const markdown: TemplateRenderer<VNode> = (strings) =>
  (remark()
    .use(vdom, {h})
    .processSync(strings.join('')).result as {children: VNode}).children
