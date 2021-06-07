import test from 'ava'
import {readFile, writeFile} from 'fs/promises'
import {config} from 'dotenv'
import {merge, from} from "rxjs";
import {Port, sink, Socket, source, PortParams, mapProc, mapToProc, latestMergeMapProc} from "@pkit/core";
import {FfmpegPort} from "./";

config()

class FfmpegTestPort extends Port {
  init = new Socket<number>();
  ffmpeg = new FfmpegPort;
  writeFile = new Socket<string>();

  testFlow = (port: this, lessonId: PortParams<this>, name = `${lessonId.toString().padStart(3, '0')}`, input = `${name}.mp4`, output = `${name}.flac`) => {
    const data = readFile(`${process.env.AUDIO_DIR}/${name}.mp4`)
    return merge(
      mapProc(from(data), sink(port.ffmpeg.init), (data) => ({
        input, output, data,
        run: ['-ss', 226, '-i', input, '-t', 27.5, output]
        // run: ['-i', input, output]
      })),

      mapToProc(source(port.ffmpeg.output), sink(port.writeFile), `/tmp/${output}`),

      latestMergeMapProc(source(port.writeFile), sink(port.complete),
        [source(port.ffmpeg.output)], async ([path, data]) =>
          writeFile(path, data))
    )
  }

  flow () {
    return merge(
      super.flow(),
      this.ffmpeg.flow()
    )
  }
}

test('simple convert', async (t) => {
  await new FfmpegTestPort().run(171).toPromise();
  t.pass()
})

