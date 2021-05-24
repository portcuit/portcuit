import {assocPath} from 'ramda'
import {Observable} from "rxjs";
import {filter, map} from "rxjs/operators";
import {Sink} from "@pkit/core";
import {PartialState, UpdateBatch, InferUpdateBatch} from "@pkit/state";
import {FlowEvent} from "../shared/";

const objFromTextContent = (doc: Document, selector: string) =>
  JSON.parse(doc.querySelector(selector)!.textContent!)

export const hydroState = (doc: Document) =>
  objFromTextContent(doc, '#hydration-state')

export const hydroParams = (doc: Document) =>
  objFromTextContent(doc, '#hydration-params')

export const updateBatchFromFlowEvent = (event: Event, dataString: string) => {
  const data: FlowEvent = JSON.parse(dataString);
  const eventPath = [...data.path, 'event'];
  const detailPath = [...data.path, 'detail'];
  return [
    [assocPath(eventPath, event, {}), assocPath(eventPath, null, {})],
    [assocPath(detailPath, data.detail, {}), assocPath(detailPath, null, {})]
  ]
}

export const bindMapProc = <
  T extends {target: {dataset: {bind: string}}},
  U extends UpdateBatch<any>,
  V extends InferUpdateBatch<U>,
  W extends U>(
  source$: Observable<T>,
  sink: Sink<U>,
  markObj: PartialState<V>,
  fn: (ev: T, data: V) => W) => {

  const markStr = JSON.stringify(markObj);
  const index = markStr.indexOf(':null');
  if (index < 0) { throw new Error('invalid mark') }
  const mark = markStr.substr(0, index + 1);

  return source$.pipe(
    filter(({target: {dataset: {bind}}}) =>
      bind.startsWith(mark)),
    map((ev) =>
      fn(ev, JSON.parse(ev.target.dataset.bind))),
    map((data) =>
      sink(data)))
}