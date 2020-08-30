"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.workerKit = exports.WorkerPort = void 0;
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const core_1 = require("pkit/core");
const processors_1 = require("pkit/processors");
const run_1 = require("pkit/run");
__exportStar(require("./remote/"), exports);
class WorkerPort extends core_1.LifecyclePort {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "run", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new run_1.RunPort
        });
        Object.defineProperty(this, "worker", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new core_1.Socket()
        });
        Object.defineProperty(this, "err", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new core_1.Socket()
        });
        Object.defineProperty(this, "msg", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new core_1.Socket()
        });
    }
}
exports.WorkerPort = WorkerPort;
exports.workerKit = (port) => rxjs_1.merge(run_1.runKit(port.run, port.running), processors_1.latestMapProc(core_1.source(port.run.start), core_1.sink(port.worker), [core_1.source(port.init)], ([, { ctor, args }]) => new ctor(...args)), processors_1.mapToProc(core_1.source(port.worker), core_1.sink(port.run.started)), processors_1.latestMergeMapProc(core_1.source(port.run.stop), core_1.sink(port.run.stopped), [core_1.source(port.worker)], ([, worker]) => {
    worker.postMessage(['terminate']);
    return rxjs_1.timer(100).pipe(operators_1.map(() => worker.terminate()), operators_1.mergeMap((data) => data instanceof Promise ? data : rxjs_1.of(data)));
}), processors_1.mapToProc(core_1.source(port.init), core_1.sink(port.ready)));
//# sourceMappingURL=index.js.map