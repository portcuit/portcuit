import { Readable } from "stream";
import {race, fromEvent, throwError} from 'rxjs'
import {switchMap, map} from 'rxjs/operators'
import { Bucket } from "@google-cloud/storage";
import { cycleFlow, latestMergeMapProc, LifecyclePort, mapToProc, ofProc, sink, Socket, source } from "@pkit/core";

export class GoogleCloudStoragePort extends LifecyclePort {
  init = new Socket<{
    bucket: string;
  }>();

  bucket = new Socket<Bucket>();
  upload = new Socket<{path: string; data: Uint8Array}>();

  event = {
    upload: new Socket<string>()
  }

  circuit() {
    return cycleFlow(this, 'init', 'terminated', {
      bucketFlow: (port, {bucket}) =>
        ofProc(sink(port.bucket), (new Storage).bucket(bucket)),

      uploadFlow: (port) => 
        latestMergeMapProc(source(port.upload), sink(port.event.upload),
        [source(port.bucket)], ([{path, data}, bucket]) => {
          const dst = bucket.file(`${path}`).createWriteStream();

          // TODO: dataを適切に分割しないとアップロード制限に引っかかる可能性がある
          Readable.from([data]).pipe(dst)

          return race(
            fromEvent(dst, 'error').pipe(switchMap((err) => throwError(err))),
            fromEvent(dst, 'finish').pipe(map(() => 
              `gs://${bucket.name}/${path}`))
          )
        }, sink(port.err)),

      terminateFlow: (port) =>
        mapToProc(source(port.terminate), sink(port.terminated))
    })
  }
}
