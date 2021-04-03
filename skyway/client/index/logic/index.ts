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

type ISkywayClientPort = ForcePublicPort<SkywayClientPort>

const peerKit: IKit<ISkywayClientPort> = (port, params) =>
  mergeMapProc(of(params), sink(port.peer),
    ({peer: {id, options}}) =>
      Promise.resolve(new Peer(id, options)),
    sink(port.err));

const peerEventKit: IKit<ISkywayClientPort> = (port) =>
  merge(
    onEventProc(source(port.peer), sink(port.event.peer.open), 'open'),
    onEventProc(source(port.peer), sink(port.event.peer.close), 'close')
  )

const roomKit: IKit<ISkywayClientPort> = (port, {room: {name, options = {}}}) =>
  latestMergeMapProc(source(port.start), sink(port.room),
    [source(port.peer)], ([,peer]) =>
      Promise.resolve(peer.joinRoom(name, options)),
    sink(port.err))

const roomEventKit: IKit<ISkywayClientPort> = (port) =>
  merge(
    onEventProc(source(port.room), sink(port.event.room.open), 'open'),
    onEventProc(source(port.room), sink(port.event.room.stream), 'stream'),
    onEventProc(source(port.room), sink(port.event.room.peerLeave), 'peerLeave'),
    onEventProc(source(port.room), sink(port.event.room.close), 'close'),
  )

const roomCloseKit: IKit<ISkywayClientPort> = (port) =>
  latestMergeMapProc(source(port.terminate), sink(port.info),
    [source(port.room)], ([,room]) =>
      Promise.resolve({closeRoom: room.close()}));

const peerDestroyKit: IKit<ISkywayClientPort> = (port) =>
  latestMergeMapProc(source(port.stopped), sink(port.info),
    [source(port.peer)], ([,peer]) =>
      Promise.resolve({closePeer: peer.destroy()}))

const lifecycleKit: IKit<ISkywayClientPort> = (port) =>
  merge(
    mapToProc(source(port.event.peer.open), sink(port.ready)),
    mapToProc(source(port.ready), sink(port.start)),
    mapToProc(source(port.event.room.open), sink(port.started)),
    mapToProc(source(port.event.room.close), sink(port.stopped)),
    mapToProc(source(port.event.peer.close), sink(port.terminated))
  )

export namespace ISkywayClientPort {
  export const prototype = {
    peerKit,
    peerEventKit,
    roomKit,
    roomEventKit,
    roomCloseKit,
    peerDestroyKit,
    lifecycleKit,
  }
  export const circuit = (port: ISkywayClientPort) =>
    mergeParamsPrototypeKit(port, prototype)
}
