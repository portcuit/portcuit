import {Stream} from "stream";
import {race, fromEvent, throwError} from 'rxjs'
import {switchMap, map} from 'rxjs/operators'
import {Bucket} from "@google-cloud/storage";
import {latestMergeMapProc, Port, mapToProc, ofProc, sink, Socket, source, Container, PortParams} from "@pkit/core";

export class GoogleCloudStoragePort extends Port {
  init = new Socket<{
    bucket: string;
  }>();

  bucket = new Socket<Bucket>();
  upload = new Socket<{path: string; stream: Stream}>();

  event = new class extends Container {
    upload = new Socket<string>()
  }

  bucketFlow = (port: this, {bucket}: PortParams<this>) =>
    ofProc(sink(port.bucket), (new Storage).bucket(bucket))

  uploadFlow = (port: this) =>
    latestMergeMapProc(source(port.upload), sink(port.event.upload),
      [source(port.bucket)], ([{path, stream}, bucket]) => {
        const dst = bucket.file(`${path}`).createWriteStream();
        stream.pipe(dst)
        return race(
          fromEvent(dst, 'error').pipe(switchMap((err) => throwError(err))),
          fromEvent(dst, 'finish').pipe(map(() =>
            `gs://${bucket.name}/${path}`)))
      }, sink(port.err))

  completeFlow = (port: this) =>
    mapToProc(source(port.terminate), sink(port.complete))
}
