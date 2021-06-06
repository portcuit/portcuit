import {createFFmpeg, FFmpeg} from "@ffmpeg/ffmpeg";
import {merge} from "rxjs";
import {Container, DeepPartialPort, latestMapProc, latestMergeMapProc, mapProc, mapToProc, mergeMapProc, ofProc, Port, PortParams, sink, Socket, source} from "@pkit/core";

export class FfmpegPort extends Port {
  init = new Socket<{
    data: Buffer;
    input: string;
    output: string;
    run: Array<string | number>;
    log?: boolean;
  }>()
  ffmpeg = new Socket<FFmpeg>();
  output = new Socket<Uint8Array>();
  event = new class extends Container {
    input = new Socket<void>()
  }

  initFlow = (port: this, {log}: PortParams<this>) =>
    ofProc(sink(port.ffmpeg), createFFmpeg({log}))

  readyFlow = (port: this) =>
    mergeMapProc(source(port.ffmpeg), sink(port.ready), async (ffmpeg) =>
      await ffmpeg.load())

  writeFileFlow = (port: this, {input, data}: PortParams<this>) =>
    latestMapProc(source(port.ready), sink(port.event.input),
      [source(port.ffmpeg)], ([, ffmpeg]) =>
      ffmpeg.FS('writeFile', input, data))

  runFlow = (port: this, {run, output}: PortParams<this>) =>
    latestMergeMapProc(source(port.event.input), sink(port.output),
      [source(port.ffmpeg)], async ([, ffmpeg]) => {
        await ffmpeg.run(...run.map((token) => token.toString()));
        return ffmpeg.FS('readFile', output)
      })

  completeFlow = (port: this) =>
    merge(
      mapToProc(source(port.output), sink(port.terminate)),
      latestMapProc(source(port.terminate), sink(port.complete),
        [source(port.ffmpeg)],
        ([, ffmpeg]) =>
          null,
        // ffmpeg.exit(),
      )
    )

  constructor (port: DeepPartialPort<FfmpegPort> = {}) {
    super(port)
  }
}

