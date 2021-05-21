import {createReadStream} from 'fs'
import {readFile} from 'fs/promises'
import minimatch from "minimatch";
import {Readable, Transform} from 'stream'
import handler from "serve-handler";
import {Observable} from "rxjs";
import {HttpServerContext} from "../../http/server";
import {mergeMapProc, Sink} from "../../core";

export const serveHandlerProc = (source$: Observable<HttpServerContext>, sink: Sink<any>, config: NonNullable<Parameters<typeof handler>[2]>) =>
  mergeMapProc(source$, sink,
    async ([req, res]) => {
      const tmp = global.encodeURIComponent;
      global.encodeURIComponent = (value) => value as string;
      const status = await handler(req, res, config);
      global.encodeURIComponent = tmp;
      return status;
    });

export const webModuleProc = (source$: Observable<HttpServerContext>, sink: Sink<any>) =>
  mergeMapProc(source$, sink,
    async ([req, res]) => {
      const data = await readFile(`${process.cwd()}${req.url}`, {encoding: 'utf-8'});
      res.writeHead(200, {
        'Content-Type': 'application/javascript; charset=utf-8'
      });
      res.end(transform(data));
    })

const transform = (data: string) => {
  const tokens = data.split("\n") as string[];
  const heads = tokens.slice(0, 50).map((line) => {
    const match = line.match(/(^.*from\s*|^.*import\s*)("[^"]+"|'[^']+')(;?\s*)/);
    if (match) {
      const [,left,piece,right] = match;
      const target = piece.replace(/["']/g, '');

      let newTarget = target;
      if (['.', '/'].some((ptn) => target.startsWith(ptn))) {
        if (target.endsWith('/')) {
          newTarget = `${target}index.js`;
        } else if (!target.endsWith('.js')) {
          newTarget = `${target}.js`;
        }
      } else if (['@pkit/**', '@app/**'].some((ptn) => minimatch(target, ptn))) {
        newTarget = `/src/${target}/index.js`
      } else {
        newTarget = `/dest/web_modules/${target}/index.js`
      }

      return `${left}"${newTarget}"${right}`
    } else {
      return line;
    }
  })

  return [...heads, ...tokens.slice(50)].join("\n");
}

