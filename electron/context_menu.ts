import {Menu} from "electron";
import {ofProc, Port, PortParams, sink, Socket} from "@pkit/core";

export class ElectronContextMenuPort extends Port {
  init = new Socket<Parameters<typeof Menu.buildFromTemplate>[number]>();
  contextMenu = new Socket<Menu>();

  contextMenuInstanceFlow = (port: this, arg: PortParams<this>) =>
    ofProc(sink(port.contextMenu), Menu.buildFromTemplate(arg))
}
