import {race, fromEvent, throwError} from 'rxjs'
import {switchMap, map} from 'rxjs/operators'
import { Bucket } from "@google-cloud/storage";
import { cycleFlow, directProc, latestMergeMapProc, LifecyclePort, mapProc, ofProc, sink, Socket, source } from "@pkit/core";
import { Readable } from "stream";

export class GoogleCloudStoragePort extends LifecyclePort {
  init = new Socket<{
    bucket: string;
  }>();

  bucket = new Socket<Bucket>();
  upload = new Socket<{path: string; data: Uint8Array}>();

  circuit() {
    return cycleFlow(this, 'init', 'terminated', {
      bucketFlow: (port, {bucket}) =>
        ofProc(sink(port.bucket), (new Storage).bucket(bucket)),

      uploadFlow: (port) => 
        latestMergeMapProc(source(port.upload), sink(port.info), 
        [source(port.bucket)], 
        ([{path, data}, bucket]) => {
          const dst = bucket.file(`${path}`).createWriteStream();

          Readable.from([data]).pipe(dst)

          return race(
            fromEvent(dst, 'error').pipe(switchMap((err) => throwError(err))),
            fromEvent(dst, 'finish').pipe(map(() => ({
              result: `gs://${bucket.name}/${path}`,
              type: 'upload'
            })))
          )
        }, sink(port.err))
    })
  }
}
