import {createFFmpeg, FFmpeg} from "@ffmpeg/ffmpeg";
import {merge} from "rxjs";
import {Container, DeepPartialPort, latestMapProc, latestMergeMapProc, mapToProc, mergeMapProc, ofProc, Port, PortParams, sink, Socket, source} from "@pkit/core";

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
    load = new Socket<void>()
  }

  createFfmpegInstanceFlow = (port: this, {log}: PortParams<this>) =>
    ofProc(sink(port.ffmpeg), createFFmpeg({log}))

  loadFlow = (port: this) =>
    mergeMapProc(source(port.ffmpeg), sink(port.event.load), async (ffmpeg) =>
      await ffmpeg.load())

  readyFlow = (port: this, {input, data}: PortParams<this>) =>
    latestMapProc(source(port.event.load), sink(port.ready),
      [source(port.ffmpeg)], ([, ffmpeg]) =>
      ffmpeg.FS('writeFile', input, data))

  runFlow = (port: this, {run, output}: PortParams<this>) =>
    latestMergeMapProc(source(port.ready), sink(port.output),
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
          null
        // it need to free memory but exit
        // ffmpeg.exit(),
      )
    )

  constructor (port: DeepPartialPort<FfmpegPort> = {}) {
    super(port)
  }
}

