import {promisify} from 'util'
import {fromEvent, race} from 'rxjs'
import {takeUntil, reduce, map, filter} from 'rxjs/operators'
import {mapToProc, directProc, IFlow, IPort, mergeMapProc, sink, source, mapProc} from "@pkit/core";
import {HttpServerRestPort} from "../";
import {makeHtmlResponse, makeJsonResponse} from './lib';

type IHttpServerRestLogicPort = IPort<HttpServerRestPort>
type Flow = IFlow<IHttpServerRestLogicPort>

export const requestBodyFlow: Flow = (port, [req]) =>
  directProc(fromEvent<Buffer>(req, 'data').pipe(
    takeUntil(fromEvent(req, 'end')),
    reduce((acc, chunk) =>
      acc.concat(chunk), [] as Buffer[]),
    map((chunks) =>
      Buffer.concat(chunks))),
    sink(port.request.body.raw))

export const readyFlow: Flow = (port) =>
  mapToProc(source(port.request.body.raw), sink(port.ready))

export const requestBodyJsonFlow: Flow = (port, [req]) =>
  mergeMapProc(source(port.request.body.raw).pipe(
    filter(() =>
      `${req.headers['content-type']}`.startsWith('application/json'))),
    sink(port.request.body.json),
    async (body) =>
      JSON.parse(body as any),
    sink(port.err))

export const htmlResponseFlow: Flow = (port) =>
  mapProc(source(port.response.html), sink(port.response.raw), makeHtmlResponse)

export const jsonResponseFlow: Flow = (port) =>
  mapProc(source(port.response.json), sink(port.response.raw), makeJsonResponse)

export const endResponseFlow: Flow = (port, [, res]) =>
  mergeMapProc(source(port.response.raw),
    sink(port.event.close), async (response) => ({
      writeHead: res.writeHead.apply(res, response.writeHeadArgs()),
      end: await promisify<void, any>(res.end).apply(res, response.endArgs())
    }))

export const restCompleteFlow: Flow = (port, [req]) =>
  directProc(race(source(port.event.close), fromEvent(req, 'aborted')),
    sink(port.terminated))
