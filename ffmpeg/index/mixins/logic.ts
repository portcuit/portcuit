import {
  ForcePublicPort,
  IKit, latestMapProc,
  latestMergeMapProc,
  LifecyclePort, mapProc, mapToProc, mergeMapProc,
  mergeParamsPrototypeKit,
  sink, Socket,
  source
} from "@pkit/core";
import {FfmpegPort} from "../";
import {createFFmpeg, FFmpeg} from "@ffmpeg/ffmpeg";
import {merge, of} from "rxjs";

type IFfmpegLogicPort = ForcePublicPort<FfmpegPort>
type Flow = IKit<IFfmpegLogicPort>

const initFlow: Flow = (port, params) =>
  mergeMapProc(of(params), sink(port.ffmpeg),
    async ({input, log, data}) => {
      const ffmpeg = createFFmpeg({log})
      await ffmpeg.load();
      ffmpeg.FS('writeFile', input, data);
      return ffmpeg;
    })

const runFlow: Flow = (port, {run, output}) =>
  mergeMapProc(source(port.ffmpeg), sink(port.output),
    async (ffmpeg) => {
      await ffmpeg.run(...run.map((token) => token.toString()));
      return ffmpeg.FS('readFile', output)
    })

const exitFlow: Flow = (port) =>
  merge(
    mapToProc(source(port.output), sink(port.terminate)),

    latestMapProc(source(port.terminate), sink(port.terminated),
      [source(port.ffmpeg)],
      ([,ffmpeg]) =>
        null,
      // ffmpeg.exit(),
    )
  )

export namespace IFfmpegLogicPort {
  export const prototype = {
    initFlow,
    runFlow,
    exitFlow
  }
  export const circuit = (port: IFfmpegLogicPort) =>
    mergeParamsPrototypeKit(port, prototype)
}

