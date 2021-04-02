import Peer, {PeerConstructorOption, SfuRoom} from "skyway-js";
import {merge, of} from "rxjs";
import {switchMap, takeUntil} from "rxjs/operators";
import {
  sink,
  Socket,
  source,
  LifecyclePort,
  fromEventProc,
  latestMapProc,
  mapToProc,
  PortParams,
  SocketData, mergeMapProc, latestMergeMapProc
} from "@pkit/core"


export abstract class RtcPort extends LifecyclePort {
  init = new Socket<{
    clientId: string;
  }>();
  join = new Socket<{
    channel: string;
    stream?: MediaStream;
  }>();
  event = new RtcEventPort;

  getPeerInfo(stream: SocketData<this['event']['enter']>): PeerInfo {
    throw 'implement me'
  }
}

class RtcEventPort {
  open = new Socket<void>();
  join = new Socket<void>();
  enter = new Socket<MediaStream>();
  leave = new Socket<string>();
  close = new Socket<void>();
}

class PeerInfo {
  constructor(public id: string) {}
}

export namespace RtcPort {
  export type Seed = {clientId: string}
}

export class RtcSkywayPort extends RtcPort {
  init = new Socket<{
    skyway: {
      peerConstructorOptions: PeerConstructorOption,
      roomOptions: Exclude<Parameters<typeof Peer.prototype.joinRoom>[number], void | string>
    }
  } & PortParams<RtcPort>>();
  peer = new Socket<Peer>();
  room = new Socket<SfuRoom>();

  event = new class extends RtcEventPort {
    enter = new Socket<MediaStream & {peerId: string}>();
  }

  err = new Socket<Error & {type: string}>();

  getPeerInfo(stream: SocketData<this['event']['enter']>) {
    return new PeerInfo(stream.peerId)
  }

  circuit() {
    return merge(
      super.circuit(),
      rtcSkywayKit(this)
    )
  }
}

const rtcSkywayKit = (port: RtcSkywayPort) =>
  merge(
    source(port.init).pipe(
      switchMap((params) => merge(
        mergeMapProc(of(params), sink(port.peer),
          ({clientId, skyway: {peerConstructorOptions}}) =>
            Promise.resolve(new Peer(clientId, peerConstructorOptions)),
          sink(port.err)),

        latestMergeMapProc(source(port.join), sink(port.room),
          [source(port.peer)], ([{channel, stream}, peer]) =>
            Promise.resolve(peer.joinRoom(channel, {
              ...params.skyway.roomOptions,
              stream,
              mode: 'sfu'
            }) as SfuRoom),
          sink(port.err)),

        latestMapProc(source(port.terminate), sink(port.info),
          [source(port.peer)], ([,room]) =>
            ({destroy: room.destroy()})),

        fromEventProc(source(port.peer), source(port.terminated), sink(port.err), 'error'),
        fromEventProc(source(port.peer), source(port.terminated), sink(port.event.open), 'open'),
        fromEventProc(source(port.peer), source(port.terminated), sink(port.event.close), 'close'),

        fromEventProc(source(port.room), source(port.terminated), sink(port.event.join), 'open'),
        fromEventProc(source(port.room), source(port.terminated), sink(port.event.enter), 'stream'),
        fromEventProc(source(port.room), source(port.terminated), sink(port.event.leave), 'peerLeave'),

        mapToProc(source(port.event.open), sink(port.ready)),
        mapToProc(source(port.event.close), sink(port.terminated)),
      ).pipe(takeUntil(source(port.terminated))))
    )
  )
