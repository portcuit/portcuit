import Peer, {PeerConstructorOption, SfuRoom, MeshRoom, RoomStream, RoomData} from "skyway-js";
import {LifecyclePort, Socket} from "@pkit/core";
import {ISkywayClientLogicPort} from "./logic/";

export class SkywayClientPort extends LifecyclePort {
  init = new Socket<{
    peer: {
      id: string;
      options: PeerConstructorOption;
    };
    room: {
      roomName: string;
      roomOptions: NonNullable<Parameters<typeof Peer.prototype.joinRoom>[1]>;
    }
  }>();

  err = new Socket<Error & {type: string}>();

  peer = new Socket<Peer>();
  room = new Socket<SfuRoom | MeshRoom>();
  send = new Socket<any>();

  event = {
    peer: {
      open: new Socket<string>(),
      close: new Socket<void>()
    },
    room: {
      open: new Socket<void>(),
      stream: new Socket<RoomStream>(),
      data: new Socket<RoomData>(),
      peerLeave: new Socket<string>(),
      close: new Socket<void>()
    }
  }

  circuit() {
    return ISkywayClientLogicPort.circuit(this);
  }
}

Object.assign(SkywayClientPort.prototype, ISkywayClientLogicPort.prototype);