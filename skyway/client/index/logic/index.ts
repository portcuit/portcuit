import Peer from "skyway-js";
import {merge, of} from "rxjs";
import {
  ForcePublicPort,
  IKit,
  latestMergeMapProc, mapToProc,
  mergeMapProc,
  mergeParamsPrototypeKit,
  sink,
  source,
  onEventProc,
} from "@pkit/core";
import {SkywayClientPort} from "../";

type ISkywayClientLogicPort = ForcePublicPort<SkywayClientPort>

const peerKit: IKit<ISkywayClientLogicPort> = (port, params) =>
  mergeMapProc(of(params), sink(port.peer),
    ({peer: {id, options}}) =>
      Promise.resolve(new Peer(id, options)),
    sink(port.err));

const peerEventKit: IKit<ISkywayClientLogicPort> = (port) =>
  merge(
    onEventProc(source(port.peer), sink(port.event.peer.open), 'open'),
    onEventProc(source(port.peer), sink(port.event.peer.close), 'close')
  )

const roomKit: IKit<ISkywayClientLogicPort> = (port, {room: {roomName, roomOptions = {}}}) =>
  latestMergeMapProc(source(port.start), sink(port.room),
    [source(port.peer)], ([,peer]) =>
      Promise.resolve(peer.joinRoom(roomName, roomOptions)),
    sink(port.err))

const roomEventKit: IKit<ISkywayClientLogicPort> = (port) =>
  merge(
    onEventProc(source(port.room), sink(port.event.room.open), 'open'),
    onEventProc(source(port.room), sink(port.event.room.stream), 'stream'),
    onEventProc(source(port.room), sink(port.event.room.peerLeave), 'peerLeave'),
    onEventProc(source(port.room), sink(port.event.room.close), 'close'),
  )

const roomCloseKit: IKit<ISkywayClientLogicPort> = (port) =>
  latestMergeMapProc(source(port.terminate), sink(port.info),
    [source(port.room)], ([,room]) =>
      Promise.resolve({closeRoom: room.close()}),
    sink(port.err));

const peerDestroyKit: IKit<ISkywayClientLogicPort> = (port) =>
  latestMergeMapProc(source(port.stopped), sink(port.info),
    [source(port.peer)], ([,peer]) =>
      Promise.resolve({closePeer: peer.destroy()}),
    sink(port.err))

const lifecycleKit: IKit<ISkywayClientLogicPort> = (port) =>
  merge(
    mapToProc(source(port.event.peer.open), sink(port.ready)),
    mapToProc(source(port.ready), sink(port.start)),
    mapToProc(source(port.event.room.open), sink(port.started)),
    mapToProc(source(port.event.room.close), sink(port.stopped)),
    mapToProc(source(port.event.peer.close), sink(port.terminated))
  )

export namespace ISkywayClientLogicPort {
  export const prototype = {
    peerKit,
    peerEventKit,
    roomKit,
    roomEventKit,
    roomCloseKit,
    peerDestroyKit,
    lifecycleKit,
  }
  export const circuit = (port: ISkywayClientLogicPort) =>
    mergeParamsPrototypeKit(port, prototype)
}
