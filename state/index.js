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
exports.stateKit = exports.StatePort = void 0;
const core_1 = require("pkit/core");
const processors_1 = require("./processors");
__exportStar(require("./processors"), exports);
class StatePort {
    constructor() {
        Object.defineProperty(this, "raw", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new core_1.Socket()
        });
        Object.defineProperty(this, "init", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new core_1.Socket()
        });
        Object.defineProperty(this, "patch", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new core_1.Socket()
        });
        Object.defineProperty(this, "data", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new core_1.Socket()
        });
    }
}
exports.StatePort = StatePort;
const defaultCompute = (state) => state;
exports.stateKit = (port, compute = defaultCompute) => processors_1.initProc(core_1.source(port.init), core_1.source(port.patch), core_1.sink(port.raw), core_1.sink(port.data), compute);
//# sourceMappingURL=index.js.map