import {promisify} from 'util'
import {fromEvent, race, of} from 'rxjs'
import {takeUntil, reduce, map, filter} from 'rxjs/operators'
import {mapToProc, cycleFlow, directProc, IFlow, IPort, mergeMapProc, sink, source, mapProc, latestMergeMapProc} from "@pkit/core";
import {HttpServerRestPort} from "../";
import {makeHtmlResponse, makeJsonResponse} from './lib';

type IHttpServerRestLogicPort = IPort<HttpServerRestPort>
type Flow = IFlow<IHttpServerRestLogicPort>

const requestBodyFlow: Flow = (port, [req]) =>
  directProc(fromEvent<Buffer>(req, 'data').pipe(
    takeUntil(fromEvent(req, 'end')),
    reduce((acc, chunk) =>
      acc.concat(chunk), [] as Buffer[]),
    map((chunks) =>
      Buffer.concat(chunks))),
    sink(port.request.body.raw))

const readyFlow: Flow = (port) =>
  mapToProc(source(port.request.body.raw), sink(port.ready))

const requestBodyJsonFlow: Flow = (port, [req]) =>
  mergeMapProc(source(port.request.body.raw).pipe(
    filter(() =>
      `${req.headers['content-type']}`.startsWith('application/json'))),
    sink(port.request.body.json),
    async (body) =>
      JSON.parse(body as any),
    sink(port.err))

const htmlResponseFlow: Flow = (port) =>
  mapProc(source(port.response.html), sink(port.response.raw), makeHtmlResponse)

const jsonResponseFlow: Flow = (port) =>
  mapProc(source(port.response.json), sink(port.response.raw), makeJsonResponse)

const endResponseFlow: Flow = (port, [, res]) =>
  mergeMapProc(source(port.response.raw),
    sink(port.event.close), async (response) => ({
      writeHead: res.writeHead.apply(res, response.writeHeadArgs()),
      end: await promisify<void, any>(res.end).apply(res, response.endArgs())
    }))

const terminatedFlow: Flow = (port, [req]) =>
  directProc(race(source(port.event.close), fromEvent(req, 'aborted')),
    sink(port.terminated))

export namespace IHttpServerRestLogicPort {
  export const prototype = {
    requestBodyFlow,
    readyFlow,
    requestBodyJsonFlow,
    htmlResponseFlow,
    jsonResponseFlow,
    endResponseFlow,
    terminatedFlow
  }
  export const flow = (port: IHttpServerRestLogicPort) =>
    cycleFlow(port, 'init', 'terminated', prototype)
}