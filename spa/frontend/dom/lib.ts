import {UpdateBatch} from "@pkit/state"

export const domEventMap = <T> (ev: {target: HTMLElement & {dataset: {bind: string}}}) => {
  if (!ev.target) {return ev}
  const batch = extractBatch(ev.target)
  if (!batch) {return ev}
  return Object.defineProperty(ev, 'batch',
    {enumerable: true, configurable: true, value: batch})
}

export const extractBatch = <T> (elm: HTMLElement): UpdateBatch<T> | null => {
  if (elm && elm.dataset && elm.dataset.bind) {
    return JSON.parse(elm.dataset.bind)
  } else if (elm.parentNode) {
    return extractBatch(elm.parentNode as HTMLElement)
  } else {
    return null
  }
}

export const createHandler = <T> () =>
  (binds: {[P in 'click' | 'change']?: UpdateBatch<T>}) =>
    Object.fromEntries(Object.entries(binds).map(([name, batch]) =>
      [`data-on-${name}`, JSON.stringify(batch)]))