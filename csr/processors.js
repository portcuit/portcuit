"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.action = exports.actionProc = void 0;
const operators_1 = require("rxjs/operators");
const pkit_1 = require("pkit");
exports.actionProc = (source$, sink) => source$.pipe(operators_1.map(([fn, data]) => sink(new Function(`return ({ReplaceObject, ReplaceArray, EphemeralBoolean, splice, padArray}) => ${fn};`)()({ ReplaceObject: pkit_1.ReplaceObject, ReplaceArray: pkit_1.ReplaceArray, EphemeralBoolean: pkit_1.EphemeralBoolean, splice: pkit_1.splice, padArray: pkit_1.padArray })(data))));
exports.action = (action, detail) => [Object.entries(action).reduce((acc, [key, value]) => ({ ...acc, [key]: value.toString()
    }), {}), detail];
//# sourceMappingURL=processors.js.map