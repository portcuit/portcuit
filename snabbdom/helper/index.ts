import type {VNode} from 'snabbdom/vnode'
import unified from 'unified'
import parse from 'remark-parse'
import vdom from 'remark-vdom'
import {h} from '@pkit/snabbdom/lib/h'

export * from './pkit'
export * from './fc'

type TemplateRenderer<T=string,U=any> = (strings: TemplateStringsArray, ...args: U[]) => T;

export const markdown: TemplateRenderer<VNode> = (strings) =>
  (unified()
    .use(parse)
    .use(vdom, {h})
    .processSync(strings.join('')).result as {children: VNode}).children
