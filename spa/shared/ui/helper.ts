import {PartialState} from "@pkit/state";
import {PkitError} from "@pkit/core";

class NotObjectError extends PkitError {}
class NotFondError extends PkitError {}
const isObject = (doc: any) =>
  !Array.isArray(doc) && typeof doc === 'object'
export const xjsonSearch = (doc: any, target: string, path: Array<string | number> = []) => {
  if (!isObject(doc)) { throw new NotObjectError(JSON.stringify(doc))}
  let key, val;
  for ([key, val] of Object.entries(doc)) {
    console.log({key, val});
    if (key === target) {
      console.log('ok', {key, val, path});
      break;
    }
    if (!isObject(val)) { continue; }
    jsonSearch(val, target, [...path, key]);
  }
  if (key !== target) { throw new NotFondError(JSON.stringify(key)) }
  return {path, [target]: val}
}

export const jsonSearch = (doc: any, target: string, path: Array<string | number> = []): any => {
  if (!isObject(doc)) { return null; }
  for (const [key, val] of Object.entries(doc)) {
    if (key === target) {
      return {path, [target]: val}
    }
    if (!isObject(val)) { continue; }
    const res = jsonSearch(val, target, [...path, key])
    if (res) { return res }
  }
  return null;
}

export const flowEvent = <T>(data: PartialState<T>) => {
  const res = jsonSearch(data, 'detail');
  if (!res) { throw new NotFondError(JSON.stringify(data)) }
  return JSON.stringify(res);
}

export const bindData = <T>(data: PartialState<T>) =>
  JSON.stringify(data)
