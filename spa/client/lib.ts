import {assocPath} from 'ramda'
import {Observable, from, of} from "rxjs";
import {filter, map, mergeMap, catchError} from "rxjs/operators";
import {Sink, source, PortMessage} from "@pkit/core";
import {PartialState, UpdateBatch, InferUpdateBatch} from "@pkit/state";
import {FlowEvent} from "@pkit/spa";

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

export const fromDomProc = <
  T extends {target: {dataset: {bind: string}}},
  U, V extends U
> (
  source$: Observable<T>, sink: Sink<U>, fn: (ev: T, batch: V) => V) => {

  return source$.pipe(
    map((ev, _, {target: {dataset: {bind}}} = ev) =>
      fn(ev, JSON.parse(bind))),
    map((data) => sink(data))
  )
}


export const dataBindProc = <
  T extends {target: {dataset: {bind: string}}},
  U extends UpdateBatch<any>,
  V extends InferUpdateBatch<U>,
  W extends U> (
    source$: Observable<T>,
    sink: Sink<U>,
    markObj: PartialState<V>,
    fn: (ev: T, data: V) => W) => {

  const markStr = JSON.stringify(markObj);
  const index = markStr.indexOf(':null');
  if (index < 0) {throw new Error('invalid mark')}
  const mark = markStr.substr(0, index + 1);

  return source$.pipe(
    filter(({target: {dataset: {bind}}}) =>
      bind.startsWith(mark)),
    map((ev) =>
      fn(ev, JSON.parse(ev.target.dataset.bind))),
    map((data) =>
      sink(data)))
}

export const bffProc = <T> (source$: Observable<UpdateBatch<T>>, sink: Sink<UpdateBatch<T>>, endpoint: string, errSink?: Sink<Error>) =>
  source$.pipe(mergeMap((batch) => {
    const stream$ = from((async () => {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify(batch)
      })
      return await res.json() as UpdateBatch<T>
    })()).pipe(map((data) => sink(data)))

    return errSink ?
      stream$.pipe(catchError((err) => of(errSink(err)))) :
      stream$
  }))
