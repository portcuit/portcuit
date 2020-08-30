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
exports.EndpointPort = exports.DataPort = exports.LifecyclePort = void 0;
const processors_1 = require("./processors");
__exportStar(require("./processors"), exports);
class LifecyclePort {
    constructor() {
        Object.defineProperty(this, "init", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new processors_1.Socket()
        });
        Object.defineProperty(this, "ready", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new processors_1.Socket()
        });
        Object.defineProperty(this, "terminate", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new processors_1.Socket()
        });
        Object.defineProperty(this, "terminated", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new processors_1.Socket()
        });
        Object.defineProperty(this, "quit", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new processors_1.Socket()
        });
        Object.defineProperty(this, "info", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new processors_1.Socket()
        });
        Object.defineProperty(this, "debug", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new processors_1.Socket()
        });
        Object.defineProperty(this, "running", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new processors_1.Socket()
        });
        Object.defineProperty(this, "err", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new processors_1.Socket()
        });
        Object.defineProperty(this, "_ns", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
}
exports.LifecyclePort = LifecyclePort;
class DataPort {
    constructor() {
        Object.defineProperty(this, "data", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new processors_1.Socket()
        });
    }
}
exports.DataPort = DataPort;
class EndpointPort {
    constructor() {
        Object.defineProperty(this, "req", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new processors_1.Socket()
        });
        Object.defineProperty(this, "res", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new processors_1.Socket()
        });
        Object.defineProperty(this, "err", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new processors_1.Socket()
        });
    }
}
exports.EndpointPort = EndpointPort;
//# sourceMappingURL=index.js.map