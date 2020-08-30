"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.childRemoteWorkerKit = void 0;
const rxjs_1 = require("rxjs");
const core_1 = require("pkit/core");
const processors_1 = require("./processors");
exports.childRemoteWorkerKit = (info, err, parentPort, socks) => rxjs_1.merge(processors_1.receiveProc(parentPort), processors_1.sendProc(core_1.sink(info), core_1.sink(err), parentPort, socks.map((sock) => [core_1.source(sock), core_1.sink(sock)])));
//# sourceMappingURL=index.js.map