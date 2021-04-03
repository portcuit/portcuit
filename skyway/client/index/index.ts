import {LifecyclePort, Socket} from "@pkit/core";
import Peer, {PeerConstructorOption, SfuRoom, MeshRoom, RoomStream} from "skyway-js";
import {ISkywayClientLogicPort} from "./logic/";

export class SkywayClientPort extends LifecyclePort {
  init = new Socket<{
    peer: {
      id: string;
      options: PeerConstructorOption;
    };
    room: {
      roomName: string,
      roomOptions: NonNullable<Parameters<typeof Peer.prototype.joinRoom>[1]>
    }
  }>();

  peer = new Socket<Peer>();
  room = new Socket<SfuRoom | MeshRoom>();

  event = {
    peer: {
      open: new Socket<string>(),
      close: new Socket<void>()
    },
    room: {
      open: new Socket<void>(),
      stream: new Socket<RoomStream>(),
      peerLeave: new Socket<string>(),
      close: new Socket<void>()
    }
  }

  circuit() {
    return ISkywayClientLogicPort.circuit(this)
  }
}

Object.assign(SkywayClientPort.prototype, ISkywayClientLogicPort.prototype);