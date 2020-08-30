"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendProc = exports.receiveProc = void 0;
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
exports.receiveProc = (worker$, prefixPath = []) => worker$.pipe(operators_1.switchMap((worker) => rxjs_1.fromEvent(worker, 'message').pipe(operators_1.map((ev) => 'data' in ev ? ev['data'] : ev), operators_1.map(([type, data]) => [prefixPath.concat(type).join('.'), data]))));
exports.sendProc = (worker$, msg$, infoSink, errSink, sourceSinks, prefixPath = []) => worker$.pipe(operators_1.switchMap((worker) => rxjs_1.merge(msg$, ...sourceSinks.map(([source$, sink]) => source$.pipe(operators_1.map((data) => sink(data)), operators_1.map(([type, data]) => [type.split('.').slice(prefixPath.length).join('.'), data])))).pipe(operators_1.mergeMap((data) => rxjs_1.of(data).pipe(operators_1.map((data) => infoSink({ send: worker.postMessage(data), data })), operators_1.catchError((err) => rxjs_1.of(errSink(err))))))));
//# sourceMappingURL=processors.js.map