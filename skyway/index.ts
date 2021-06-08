import Peer, {PeerConstructorOption, SfuRoom, MeshRoom, RoomStream, RoomData} from "skyway-js";
import {Container, LifecyclePort, Socket} from "@pkit/core";
import * as logic from "./logic/";

export class SkywayPort extends LifecyclePort {
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

  event = new class extends Container {
    peer = new class extends Container {
      open = new Socket<string>()
      close = new Socket<void>()
    }
    room = new class extends Container {
      open = new Socket<void>()
      stream = new Socket<RoomStream>()
      data = new Socket<RoomData>()
      peerLeave = new Socket<string>()
      close = new Socket<void>()
    }
  }
}

Object.assign(SkywayPort.prototype, logic);