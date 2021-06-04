import {OutgoingHttpHeaders, ServerResponse} from "http";
import {mergeDeepLeft} from 'ramda'

export class HttpServerRestResponse {
  constructor(public body?: any, public init?: ResponseInit) {}

  writeHeadArgs (): Parameters<typeof ServerResponse.prototype.writeHead> {
    const status = this.init?.status ?? 200;

    if (this.init?.statusText && this.init?.headers) {
      return [status, this.init.statusText, this.init.headers] as any;
    } else if (this.init?.headers) {
      return [status, this.init.headers];
    } else {
      return [status];
    }
  }

  endArgs (): Parameters<typeof ServerResponse.prototype.end> {
    return this.body ? [this.body] as any : [] as any;
  }
}

type ResponseInit = {
  status?: number;
  statusText?: string;
  headers?: OutgoingHttpHeaders;
}

export const makeJsonResponse = (json: any, init?: ResponseInit) =>
  new HttpServerRestResponse(JSON.stringify(json), mergeDeepLeft({
    status: init?.status ?? 200,
    headers: {'Content-Type': 'application/json; charset=utf-8'}
  }, init ?? {}))

export const makeHtmlResponse = (html: string, init? : ResponseInit) =>
  new HttpServerRestResponse(html, mergeDeepLeft({
    status: init?.status ?? 200,
    headers: {'Content-Type': 'text/html; charset=utf-8'}
  }, init ?? {}))
