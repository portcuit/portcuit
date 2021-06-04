import {ServerResponse} from "http";
import {Port, Socket} from "@pkit/core";
import {HttpServerContext} from "@pkit/http/server";
import {IHttpServerRestLogicPort} from "./mixins/logic";
import {HttpServerRestResponse} from './mixins/lib';

export class HttpServerRestPort extends Port {
  init = new Socket<HttpServerContext>();
  request = new class {
    body = new class {
      raw = new Socket<Buffer>();
      json = new Socket<any>();
    }
  }
  response = new class {
    raw = new Socket<HttpServerRestResponse>();
    json = new Socket<any>();
    html = new Socket<string>();
  }
  event = new class {
    close = new Socket<{writeHead: ServerResponse, end: void}>();
  }

  flow () {
    return IHttpServerRestLogicPort.flow(this)
  }
}

