import {Observable} from "rxjs";
import {HttpServerContext} from "../../http/server";
import {mergeMapProc, Sink} from "../../core";
import handler from "serve-handler";

export const serveHandlerProc = (source$: Observable<HttpServerContext>, sink: Sink<any>, config: NonNullable<Parameters<typeof handler>[2]>) =>
  mergeMapProc(source$, sink,
    async ([req, res]) => {
      const tmp = global.encodeURIComponent;
      global.encodeURIComponent = (value) => value as string;
      const status = await handler(req, res, config);
      global.encodeURIComponent = tmp;
      return status;
    });