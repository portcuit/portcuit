"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sseServerRemoteKit = exports.sseServerKit = exports.SseServerPort = void 0;
const rxjs_1 = require("rxjs");
const util_1 = require("util");
const core_1 = require("pkit/core");
const processors_1 = require("pkit/processors");
const processors_2 = require("./processors");
class SseServerPort extends core_1.LifecyclePort {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "id", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new core_1.Socket()
        });
        Object.defineProperty(this, "client", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new core_1.Socket()
        });
        Object.defineProperty(this, "event", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new class {
                constructor() {
                    Object.defineProperty(this, "close", {
                        enumerable: true,
                        configurable: true,
                        writable: true,
                        value: new core_1.Socket()
                    });
                }
            }
        });
    }
}
exports.SseServerPort = SseServerPort;
exports.sseServerKit = (port) => rxjs_1.merge(processors_2.connectProc(core_1.source(port.init), core_1.sink(port.id)), processors_1.mapProc(core_1.source(port.init), core_1.sink(port.client), ({ args: [req] }) => req), processors_1.directProc(core_1.source(port.id), core_1.sink(port.ready)), processors_1.fromEventProc(core_1.source(port.client), core_1.sink(port.event.close), 'close'), processors_1.latestMergeMapProc(core_1.source(port.terminate), core_1.sink(port.info), [core_1.source(port.init)], async ([, { args: [, res] }]) => ({
    end: await util_1.promisify(res.end).call(res)
})), processors_1.latestMapProc(core_1.source(port.event.close), core_1.sink(port.terminated), [core_1.source(port.id)], ([, id]) => ({
    sse: id
})));
exports.sseServerRemoteKit = (port, socks) => rxjs_1.merge(processors_2.sendProc(core_1.source(port.init), core_1.source(port.event.close), core_1.sink(port.debug), socks.map(sock => [core_1.source(sock), core_1.sink(sock)])));
//# sourceMappingURL=index.js.map