import Peer from "skyway-js";
import {merge, of} from "rxjs";
import {
  IFlow,
  latestMergeMapProc, mapToProc,
  mergeMapProc,
  sink,
  source,
  fromEventProc,
} from "@pkit/core";
import {SkywayClientPort} from "../";

type Flow = IFlow<SkywayClientPort>

export const peerInstanceFlow: Flow = (port, params) =>
  mergeMapProc(of(params), sink(port.peer),
    ({peer: {id, options}}) =>
      Promise.resolve(new Peer(id, options)),
    sink(port.err));

export const peerEventFlow: Flow = (port) =>
  merge(
    fromEventProc(source(port.peer), sink(port.event.peer.open), 'open'),
    fromEventProc(source(port.peer), sink(port.event.peer.close), 'close')
  )

export const roomFlow: Flow = (port, {room: {roomName, roomOptions = {}}}) =>
  latestMergeMapProc(source(port.start), sink(port.room),
    [source(port.peer)], ([,peer]) =>
      Promise.resolve(peer.joinRoom(roomName, roomOptions)),
    sink(port.err))

export const roomEventFlow: Flow = (port) =>
  merge(
    fromEventProc(source(port.room), sink(port.event.room.open), 'open'),
    fromEventProc(source(port.room), sink(port.event.room.stream), 'stream'),
    fromEventProc(source(port.room), sink(port.event.room.data), 'data'),
    fromEventProc(source(port.room), sink(port.event.room.peerLeave), 'peerLeave'),
    fromEventProc(source(port.room), sink(port.event.room.close), 'close'),
  )

export const roomCloseFlow: Flow = (port) =>
  latestMergeMapProc(source(port.terminate), sink(port.info),
    [source(port.room)], ([,room]) =>
      Promise.resolve({closeRoom: room.close()}),
    sink(port.err));

export const peerDestroyFlow: Flow = (port) =>
  latestMergeMapProc(source(port.stopped), sink(port.info),
    [source(port.peer)], ([,peer]) =>
      Promise.resolve({closePeer: peer.destroy()}),
    sink(port.err))

export const sendFlow: Flow = (port) =>
  latestMergeMapProc(source(port.send), sink(port.info),
    [source(port.room)], ([data,room]) =>
      Promise.resolve({sendRoom: room.send(data)}),
    sink(port.err))

export const directFlow: Flow = (port) =>
  merge(
    mapToProc(source(port.event.peer.open), sink(port.ready)),
    mapToProc(source(port.ready), sink(port.start)),
    mapToProc(source(port.event.room.open), sink(port.started)),
    mapToProc(source(port.event.room.close), sink(port.stopped)),
    mapToProc(source(port.event.peer.close), sink(port.terminated))
  )