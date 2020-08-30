"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.httpServerApiTerminateKit = exports.httpServerApiKit = exports.HttpServerApiPort = void 0;
const util_1 = require("util");
require("snabbdom-to-html");
const init_1 = __importDefault(require("snabbdom-to-html/init"));
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const core_1 = require("pkit/core");
const processors_1 = require("pkit/processors");
const processors_2 = require("pkit/http/server/processors");
const selector_1 = require("@pkit/snabbdom/ssr/modules/selector");
const jsx_1 = require("@pkit/snabbdom/ssr/modules/jsx");
const class_1 = __importDefault(require("snabbdom-to-html/modules/class"));
const toHTML = init_1.default([selector_1.selectorModule, class_1.default, jsx_1.jsxModule]);
class ContentTypePort {
    constructor() {
        Object.defineProperty(this, "json", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new core_1.Socket()
        });
        Object.defineProperty(this, "html", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new core_1.Socket()
        });
        Object.defineProperty(this, "vnode", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new core_1.Socket()
        });
    }
}
class HttpServerApiPort extends core_1.LifecyclePort {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "json", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new core_1.Socket()
        });
        Object.defineProperty(this, "html", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new core_1.Socket()
        });
        Object.defineProperty(this, "vnode", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new core_1.Socket()
        });
        Object.defineProperty(this, "notFound", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new ContentTypePort
        });
        Object.defineProperty(this, "terminate", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new core_1.Socket()
        });
    }
}
exports.HttpServerApiPort = HttpServerApiPort;
exports.httpServerApiKit = (port) => rxjs_1.merge(processors_1.mapProc(core_1.source(port.json), core_1.sink(port.terminate), (data) => [200, { 'Content-Type': 'application/json; charset=utf-8' }, JSON.stringify(data)]), processors_1.mapProc(core_1.source(port.html), core_1.sink(port.terminate), (data) => [200, { 'Content-Type': 'text/html; charset=utf-8' }, data]), processors_1.mapProc(core_1.source(port.notFound.json), core_1.sink(port.terminate), (data) => [404, { 'Content-Type': 'application/json; charset=utf-8' }, JSON.stringify(data)]), processors_1.mapProc(core_1.source(port.notFound.html), core_1.sink(port.terminate), (data) => [404, { 'Content-Type': 'text/html; charset=utf-8' }, data]), processors_1.latestMergeMapProc(core_1.source(port.terminate), core_1.sink(port.terminated), [core_1.source(port.init)], ([[statusCode, headers, body], [, res]]) => {
    res.writeHead(statusCode, headers);
    return util_1.promisify(res.end).call(res, body);
}), processors_1.mapProc(core_1.source(port.vnode), core_1.sink(port.html), (data) => toHTML(data)), processors_1.mapProc(core_1.source(port.notFound.vnode), core_1.sink(port.notFound.html), (data) => toHTML(data)));
exports.httpServerApiTerminateKit = (port) => rxjs_1.merge(processors_1.mapToProc(core_1.source(port.init).pipe(operators_1.filter(processors_2.isNotReserved)), core_1.sink(port.terminated)));
//# sourceMappingURL=index.js.map