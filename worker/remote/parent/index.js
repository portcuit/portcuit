"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parentRemoteWorkerKit = void 0;
const rxjs_1 = require("rxjs");
const core_1 = require("pkit/core");
const processors_1 = require("./processors");
exports.parentRemoteWorkerKit = (port, socks, base) => rxjs_1.merge(processors_1.receiveProc(core_1.source(port.worker), base ? core_1.portPath(base) : []), processors_1.sendProc(core_1.source(port.worker), core_1.source(port.msg), core_1.sink(port.debug), core_1.sink(port.err), socks.map((sock) => [core_1.source(sock), core_1.sink(sock)]), base ? core_1.portPath(base) : []));
//# sourceMappingURL=index.js.map