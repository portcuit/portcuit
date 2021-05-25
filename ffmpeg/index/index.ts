import {EndpointPort, LifecyclePort, Socket} from "@pkit/core";
import {FFmpeg} from "@ffmpeg/ffmpeg";
import {merge} from "rxjs";
import {IFfmpegLogicPort} from "./mixins/logic";

export class FfmpegPort extends LifecyclePort {
  init = new Socket<{
    data: Buffer;
    input: string;
    output: string;
    run: Array<string | number>;
    log?: boolean;
  }>()
  ffmpeg = new Socket<FFmpeg>();
  output = new Socket<Uint8Array>();

  circuit() {
    const port = this;
    return merge(
      IFfmpegLogicPort.circuit(port)
    )
  }
}
Object.assign(FfmpegPort.prototype, IFfmpegLogicPort.prototype);
