import {merge} from "rxjs";
import {Socket, source, sink, mapProc, LifecyclePort, PortParams} from '@pkit/core'
import {IPiePort} from "./index";
import {PuppeteerPort} from "@pkit/puppeteer";
import {ElectronPort} from "@pkit/electron";

class PieTestPort extends LifecyclePort implements IPiePort {
  init = new Socket<{a: string} & PortParams<IPiePort>>();
  puppeteer = new PuppeteerPort;
  electron = new ElectronPort;
  kick = new Socket<{headless: boolean}>();
  b = new Socket<string>();

  circuit () {
    return merge(
      IPiePort.circuit(this)
    )
  }
}