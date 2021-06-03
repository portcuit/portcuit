import {readFile, writeFile} from 'fs/promises'
import {latestMergeMapProc, Port, mapToProc, mergeMapProc, sink, Socket, source} from "@pkit/core";
import {FfmpegPort} from "./index";
import {merge, of} from "rxjs";
import {config} from 'dotenv'
import {switchMap, takeUntil} from "rxjs/operators";

config()


class FfmpegTestPort extends Port {
  init = new Socket<number>();
  ffmpeg = new FfmpegPort;

  flow() {
    const port = this;
    return merge(
      port.ffmpeg.flow(),

      source(port.init).pipe(
        switchMap((lessonId, _, name=`${lessonId.toString().padStart(3, '0')}`, input=`${name}.mp4`, output=`${name}.flac`) => merge(
          mergeMapProc(of(true), sink(port.ffmpeg.init),
            async () =>
              ({
                input, output,
                data: await readFile(`${process.env.AUDIO_DIR}/${name}.mp4`),
                run: ['-ss', 226, '-i', input, '-t', 27.5, output]
                // run: ['-i', input, output]
              })),

          mergeMapProc(source(port.ffmpeg.output), sink(port.terminated),
            async (data) =>
              writeFile(`/tmp/${output}`, data)),

        ).pipe(takeUntil(source(port.terminated))))
      )
    )
  }
}


const test = async () => {
  const logs = await new FfmpegTestPort().run(171).toPromise();
  console.log('finish', logs);
}

await test();
