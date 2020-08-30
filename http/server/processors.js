"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.promiseJsonProc = exports.remoteReceiveProc = exports.notFoundProc = exports.preflightProc = exports.routeProc = exports.route = exports.get = exports.isMatchEndpoint = exports.isNotReserved = exports.reserveResponse = void 0;
const util_1 = require("util");
const minimatch_1 = __importDefault(require("minimatch"));
const ramda_1 = require("ramda");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
exports.reserveResponse = (id = (new Date).getTime().toString()) => ([, res]) => res.setHeader('X-Request-Id', id);
exports.isNotReserved = ([, res]) => !res.hasHeader('X-Request-Id');
exports.isMatchEndpoint = (pattern, targetMethod) => ([{ url, headers: { origin }, method }]) => minimatch_1.default((new URL(`${origin || 'file://'}${url}`)).pathname, pattern) &&
    (targetMethod ? method === targetMethod : true);
exports.get = (pattern, source$) => exports.route(pattern, source$, 'GET');
exports.route = (pattern, source$, method) => source$.pipe(operators_1.filter(exports.isNotReserved), operators_1.filter(exports.isMatchEndpoint(pattern, method)), operators_1.tap(exports.reserveResponse()));
exports.routeProc = (source$, sink, fn) => source$.pipe(operators_1.filter(([, res]) => !res.hasHeader('X-Request-Id')), operators_1.filter(([req, res]) => {
    const { method, url, headers: { origin } } = req;
    return fn([{ method, url: new URL(`${origin || 'file://'}${url}`) }, [req, res]]);
}), operators_1.tap(([, res]) => res.setHeader('X-Request-Id', (new Date).getTime().toString())), operators_1.tap(([, res]) => res.setHeader('Access-Control-Allow-Origin', '*')), operators_1.map((data) => sink(data)));
exports.preflightProc = (source$, sink) => source$.pipe(operators_1.filter(([, res]) => !res.hasHeader('X-Request-Id')), operators_1.filter(([{ method }]) => method === 'OPTIONS'), operators_1.tap(([, res]) => res.writeHead(204, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Origin, Authorization, Accept, Content-Type',
    'Access-Control-Max-Age': '3600',
    'X-Request-Id': (new Date).getTime().toString()
})), operators_1.mergeMap(([req, res]) => rxjs_1.from(util_1.promisify(res.end).bind(res)()).pipe(operators_1.map(() => sink({ name: 'preflight',
    ...ramda_1.pick(['url'], req) })))));
exports.notFoundProc = (source$, sink) => source$.pipe(operators_1.filter(([, res]) => !res.hasHeader('X-Request-Id')), operators_1.tap(([, res]) => res.writeHead(404, {
    'Access-Control-Allow-Origin': '*',
    'X-Request-Id': (new Date).getTime().toString()
})), operators_1.mergeMap(([req, res]) => rxjs_1.from(util_1.promisify(res.end).bind(res)()).pipe(operators_1.map(() => sink({ name: 'notFound',
    ...ramda_1.pick(['url', 'method'], req) })))));
exports.remoteReceiveProc = (source$, sink, errSink) => source$.pipe(operators_1.mergeMap(([req, res]) => rxjs_1.fromEvent(req, 'data').pipe(operators_1.takeUntil(rxjs_1.fromEvent(req, 'end')), operators_1.toArray(), operators_1.mergeMap((chunks) => rxjs_1.merge(rxjs_1.of(JSON.parse(Buffer.concat(chunks).toString())), rxjs_1.of([200, JSON.stringify({ error: false })]).pipe(operators_1.tap(([statusCode]) => res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' })), operators_1.mergeMap(([, payload]) => util_1.promisify(res.end).call(res, payload)), operators_1.map(() => sink())))), operators_1.catchError(err => rxjs_1.merge(rxjs_1.of(errSink(err)), ...err instanceof SyntaxError ? [
    rxjs_1.of([400, JSON.stringify({ error: true, message: err.message })]).pipe(operators_1.tap(([statusCode]) => res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' })), operators_1.mergeMap(([, payload]) => util_1.promisify(res.end).call(res, payload)), operators_1.map(() => sink()))
] : [])))));
exports.promiseJsonProc = (source$, sink, fn) => source$.pipe(operators_1.mergeMap(([req, res]) => rxjs_1.fromEvent(req, 'data').pipe(operators_1.takeUntil(rxjs_1.fromEvent(req, 'end')), operators_1.toArray(), operators_1.map((chunks) => Buffer.concat(chunks).toString()), operators_1.mergeMap((body) => fn(JSON.parse(body))), operators_1.map((data) => [200, JSON.stringify(data)]), operators_1.catchError((err) => rxjs_1.of([400, JSON.stringify({ error: { message: err.message } })])), operators_1.tap(([statusCode]) => res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' })), operators_1.mergeMap(([, payload]) => util_1.promisify(res.end).call(res, payload)), operators_1.map(() => sink()))));
//# sourceMappingURL=processors.js.map