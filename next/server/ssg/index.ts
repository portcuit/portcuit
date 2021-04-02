import {promisify} from 'util'
import {resolve} from 'path'
import glob from 'glob'
import {merge} from "rxjs";
import {
  latestMergeMapProc,
  LifecyclePort,
  mergeMapProc, PortParams,
  sink,
  Socket,
  source
} from "@pkit/core";
import {SnabbdomServerPort} from "@pkit/snabbdom/server";
import {writeFile} from "fs";
import {NextState} from "../../shared/";
import {INextRenderPort, NextStatePort} from "../ssr/";

export type NextSsgInfo = [fileName: string, input: string, output: string];

export class NextSsgPort<T extends NextState> extends NextStatePort<T> {
  init = new Socket<{
    info: NextSsgInfo,
  } & PortParams<INextRenderPort<T>> & PortParams<NextStatePort<T>>>();
  vdom = new SnabbdomServerPort();
  circuit () {
    return merge(
      super.circuit(),
      INextRenderPort.circuit(this),
      ssgPublishKit<T>(this)
    );
  }
}

const ssgPublishKit = <T extends NextState>(port: NextSsgPort<T>) =>
  latestMergeMapProc(source(port.vdom.html), sink(port.terminated),
    [source(port.init)], async ([html,{info: [fileName, input, output]}]) => {
      const path = `${output}${fileName.substr(input.length).replace(/\/ui/, '')}.html`;
      return {writeFile: await promisify(writeFile)(path, html), path}
    })

class Port extends LifecyclePort {
  init = new Socket<[input: string, output?: string]>();
  files = new Socket<string[]>();
}

const circuit = (port: Port) =>
  merge(
    mergeMapProc(source(port.init), sink(port.files), ([input]) =>
      promisify(glob)(`${input}/**/[!_]*.tsx`)),
    latestMergeMapProc(source(port.files), sink(port.terminated),
      [source(port.init)], async ([files, [input, output]]) => {
      for (const file of files) {
        const fileName = resolve(file.slice(0, -4));
        const {createSsg} = require(fileName);
        if (createSsg && typeof createSsg === 'function') {
          // await terminatedComplete(mount(createSsg(fileName, resolve(input), output && resolve(output)))).toPromise();
        } else {
          console.log(`${fileName} has no Ssg.`);
        }
      }
    }))
