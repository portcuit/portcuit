"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runKit = exports.RunPort = void 0;
const rxjs_1 = require("rxjs");
const core_1 = require("pkit/core");
const processors_1 = require("pkit/processors");
const processors_2 = require("./processors");
class RunPort {
    constructor() {
        Object.defineProperty(this, "start", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new core_1.Socket()
        });
        Object.defineProperty(this, "started", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new core_1.Socket()
        });
        Object.defineProperty(this, "stop", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new core_1.Socket()
        });
        Object.defineProperty(this, "stopped", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new core_1.Socket()
        });
        // TODO: running を受けて、startedが発行されるまでの間にrestartされたら例外を発行するとか？
        Object.defineProperty(this, "restart", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new core_1.Socket()
        });
        Object.defineProperty(this, "restarted", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new core_1.Socket()
        });
    }
}
exports.RunPort = RunPort;
// TODO: distinctを実装 filterDistinctProc とか？
exports.runKit = (port, running) => rxjs_1.merge(processors_1.filterProc(core_1.source(running), core_1.sink(port.start), (running) => running), processors_1.filterProc(core_1.source(running), core_1.sink(port.stop), (running) => !running), processors_2.restartProc(core_1.source(port.restart), core_1.source(running), core_1.source(port.stopped), core_1.source(port.started), core_1.sink(running), core_1.sink(port.restarted)));
//# sourceMappingURL=index.js.map