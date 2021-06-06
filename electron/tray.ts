import {Tray} from "electron";
import {merge} from 'rxjs'
import {Container, fromEventProc, ofProc, Port, PortParams, sink, Socket, source} from "@pkit/core";
import {ElectronContextMenuPort} from "./context_menu";

type TrayEvent = [Event & {sender: Tray}, {x: number; y: number; width: number; height: number}]

export class ElectronTrayPort extends Port {
  init = new Socket<{tray: ConstructorParameters<typeof Tray>}>();
  tray = new Socket<Tray>();
  event = new Container ({
    click: new Socket<TrayEvent>(),
    rightClick: new Socket<TrayEvent>()
  })
  contextMenu = new ElectronContextMenuPort;

  trayInstanceFlow = (port: this, {tray}: PortParams<this>) =>
    ofProc(sink(port.tray), new Tray(...tray))

  eventFlow = (port: this) =>
    merge(...Object.entries(port.event).map(([name, sock]) =>
      fromEventProc(source<any>(port.tray), sink(sock), name)))

  flow () {
    return merge(
      super.flow(),
      this.contextMenu.flow(),
    )
  }
}
