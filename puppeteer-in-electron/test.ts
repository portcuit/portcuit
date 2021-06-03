import {merge} from "rxjs";
import {Socket, source, sink, mapProc, Port, PortParams} from '@pkit/core'
import {IPiePort} from "./index";
import {PuppeteerPort} from "@pkit/puppeteer";
import {ElectronPort} from "@pkit/electron";

class PieTestPort extends Port implements IPiePort {
  init = new Socket<{a: string} & PortParams<IPiePort>>();
  puppeteer = new PuppeteerPort;
  electron = new ElectronPort;
  kick = new Socket<{headless: boolean}>();
  b = new Socket<string>();

  // flow () {
  //   return merge(
  //     IPiePort.circuit(this)
  //   )
  // }
}