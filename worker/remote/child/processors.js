"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendProc = exports.receiveProc = void 0;
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
exports.receiveProc = (parentPort) => rxjs_1.fromEvent(parentPort, 'message').pipe(operators_1.map((ev) => 'data' in ev ? ev['data'] : ev), operators_1.map((data) => data));
exports.sendProc = (debugSink, errSink, parentPort, sourceSinks) => rxjs_1.merge(...sourceSinks.map(([source$, sink]) => source$.pipe(operators_1.map((data) => sink(data))))).pipe(operators_1.mergeMap((data) => rxjs_1.of(data).pipe(operators_1.map((data) => debugSink({ send: parentPort.postMessage(data), data })), operators_1.catchError((err) => rxjs_1.of(errSink(err))))));
//# sourceMappingURL=processors.js.map