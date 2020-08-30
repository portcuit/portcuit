"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.restartProc = void 0;
const operators_1 = require("rxjs/operators");
exports.restartProc = (source$, running$, stopped$, started$, runningSink, restartedSink) => source$.pipe(operators_1.withLatestFrom(running$), operators_1.filter(([, running]) => running), operators_1.mergeMap(([data]) => stopped$.pipe(operators_1.take(1), operators_1.mergeMap(() => started$.pipe(operators_1.take(1), operators_1.map(() => restartedSink(data)), operators_1.startWith(runningSink(true)))), operators_1.startWith(runningSink(false)))), operators_1.delay(0));
//# sourceMappingURL=processors.js.map