"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.throwErrorIfUndefined = exports.ns2path = exports.Pkit = exports.mount = exports.terminatedComplete = exports.entry = exports.portPath = exports.sink = exports.source = exports.Socket = void 0;
const minimatch_1 = __importDefault(require("minimatch"));
const ramda_1 = require("ramda");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
class Socket {
    constructor() {
        Object.defineProperty(this, "source$", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "sink", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "path", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
}
exports.Socket = Socket;
const portSink = (data) => data;
exports.source = (sock) => sock.source$;
exports.sink = (sock) => sock.sink;
exports.portPath = (port) => (port instanceof Socket) ? port.path : port._ns;
exports.entry = (port, circuit, params) => {
    var _a, _b;
    const subject$ = new rxjs_1.Subject(), source$ = subject$.asObservable(), group$ = source$.pipe(operators_1.groupBy(([portType]) => portType)), stream$ = rxjs_1.merge(circuit(inject(port, group$)), rxjs_1.of(['init', params]));
    // @ts-ignore
    subject$.exclude = [];
    subject$.include = ((_b = (_a = globalThis === null || globalThis === void 0 ? void 0 : globalThis.process) === null || _a === void 0 ? void 0 : _a.env) === null || _b === void 0 ? void 0 : _b.NODE_ENV) === 'production' ? [] : ['*'];
    stream$.pipe(operators_1.tap(([type, data]) => {
        const { include, exclude } = subject$;
        if (include.some((ptn) => minimatch_1.default(type, ptn)) &&
            !exclude.some((ptn) => minimatch_1.default(type, ptn))) {
            console.debug(type, data);
        }
    })).subscribe(subject$);
    return subject$;
};
exports.terminatedComplete = (subject$) => subject$.pipe(operators_1.tap(([type]) => type === 'terminated' && subject$.complete()));
exports.mount = ([Port, circuit, params]) => exports.entry(new Port, circuit, params);
const isSocket = (sock) => sock instanceof Socket;
const inject = (port, group$) => {
    const walk = (port, ns = []) => {
        for (const [key, sock] of Object.entries(port)) {
            if (isSocket(sock)) {
                const portPath = ns.concat(key);
                const portType = portPath.join('.');
                const source$ = group$.pipe(operators_1.filter(({ key }) => key === portType), operators_1.switchMap(ramda_1.identity), operators_1.map(([, portValue]) => portValue), operators_1.share());
                const sink = (value) => [portType, value];
                Object.assign(sock, { source$, sink, path: portPath });
            }
            else if (key !== '_ns') {
                port[key] = walk(sock, ns.concat(key));
                if (ramda_1.is(Object, sock) && !sock['_ns']) {
                    Object.defineProperty(sock, '_ns', {
                        value: ns.concat(key),
                        writable: false
                    });
                    // sock['_ns'] = ns.concat(key);
                }
            }
        }
        return port;
    };
    return walk(port);
};
var Pkit;
(function (Pkit) {
    class Error extends globalThis.Error {
        constructor(message) {
            super();
            Object.defineProperty(this, 'name', {
                get: () => this.constructor.name,
            });
            Object.defineProperty(this, 'message', {
                get: () => message,
            });
            globalThis.Error.captureStackTrace(this, this.constructor);
        }
    }
    Pkit.Error = Error;
    class EventError extends Error {
        constructor(error) {
            super(JSON.stringify(error));
            Object.defineProperty(this, "error", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: error
            });
        }
    }
    Pkit.EventError = EventError;
})(Pkit = exports.Pkit || (exports.Pkit = {}));
exports.ns2path = (ns) => {
    const products = [];
    const walk = (ns, path = []) => {
        if (ns === null || ramda_1.isEmpty(ns)) {
            products.push(path);
            return;
        }
        else {
            // TODO: 配列型にも対応!!
            return Object.entries(ns).map(([key, val]) => walk(val, path.concat(key)));
        }
    };
    walk(ns);
    return products;
};
exports.throwErrorIfUndefined = (data) => {
    if (data === undefined) {
        throw new Error('data is undefined');
    }
    return data;
};
//# sourceMappingURL=processors.js.map