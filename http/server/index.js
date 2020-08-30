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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundKit = exports.httpServerRemoteKit = exports.httpServerKit = exports.HttpServerPort = void 0;
const util_1 = require("util");
const http_1 = __importDefault(require("http"));
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const core_1 = require("pkit/core");
const processors_1 = require("pkit/processors");
const run_1 = require("pkit/run");
const processors_2 = require("./processors");
__exportStar(require("./processors"), exports);
__exportStar(require("./sse/"), exports);
__exportStar(require("./api/"), exports);
class HttpServerPort extends core_1.LifecyclePort {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "run", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new run_1.RunPort
        });
        Object.defineProperty(this, "server", {
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
                    Object.defineProperty(this, "request", {
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
exports.HttpServerPort = HttpServerPort;
exports.httpServerKit = (port) => rxjs_1.merge(run_1.runKit(port.run, port.running), processors_1.mapProc(core_1.source(port.init), core_1.sink(port.server), ({ server = {} }) => http_1.default.createServer(server)), processors_1.mergeMapProc(core_1.source(port.server), core_1.sink(port.event.request), (server) => rxjs_1.fromEvent(server, 'request')), processors_1.mapToProc(core_1.source(port.server).pipe(operators_1.delay(0)), core_1.sink(port.ready)), processors_1.latestMergeMapProc(core_1.source(port.run.start), core_1.sink(port.run.started), [core_1.source(port.init), core_1.source(port.server)], ([, { listen = [] }, server]) => util_1.promisify(server.listen).apply(server, listen)), processors_1.latestMergeMapProc(core_1.source(port.run.stop), core_1.sink(port.run.stopped), [core_1.source(port.server)], ([, server]) => util_1.promisify(server.close).call(server)));
exports.httpServerRemoteKit = (port) => processors_2.remoteReceiveProc(core_1.source(port.req), core_1.sink(port.res), core_1.sink(port.err));
exports.notFoundKit = (port) => processors_2.notFoundProc(core_1.source(port.event.request), core_1.sink(port.info));
//# sourceMappingURL=index.js.map