import {UpdateBatch} from "@pkit/state"

export const domEventMap = (ev: {target: HTMLElement & {dataset: {bind: string}}}) => {
  if (!ev.target) {return ev}
  const batch = extractBatch(ev.target)
  if (!batch) {return ev}
  return Object.defineProperty(ev, 'batch',
    {enumerable: true, value: batch})
}

export const extractBatch = (elm: HTMLElement): UpdateBatch<any> | null => {
  if (elm && elm.dataset && elm.dataset.bind) {
    return JSON.parse(elm.dataset.bind)
  } else if (elm.parentNode) {
    return extractBatch(elm.parentNode as HTMLElement)
  } else {
    return null
  }
}