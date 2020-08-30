"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.padArray = exports.splice = exports.initProc = exports.patch = exports.EphemeralBoolean = exports.ReplaceObject = exports.ReplaceArray = exports.PreserveArray = void 0;
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
class PreserveArray extends Array {
    constructor(...props) {
        // @ts-ignore
        super(...props);
    }
}
exports.PreserveArray = PreserveArray;
class ReplaceArray extends Array {
    constructor(...props) {
        // @ts-ignore
        super(...props);
    }
}
exports.ReplaceArray = ReplaceArray;
class ReplaceObject {
    constructor(data) {
        Object.assign(this, data);
    }
}
exports.ReplaceObject = ReplaceObject;
class EphemeralBoolean extends Boolean {
    constructor(data) {
        super(data);
    }
    toJSON() {
        return undefined;
    }
}
exports.EphemeralBoolean = EphemeralBoolean;
exports.patch = (plan, data) => {
    if (plan === null
        || plan === undefined
        || plan.constructor === Boolean
        || plan.constructor === EphemeralBoolean
        || plan.constructor === String
        || plan.constructor === Number
        || plan.constructor === ReplaceArray
        || plan.constructor === ReplaceObject) {
        return plan;
    }
    else if (plan.constructor === Array) {
        if (data.constructor !== Array) {
            throw Error('data is not Array.');
        }
        const items = [];
        plan.forEach((value, index) => items.unshift([index, value]));
        for (const [index, val] of items) {
            if (val === undefined) {
                data.splice(index, 1);
            }
            else if (data[index] === undefined) {
                data[index] = val;
            }
            else {
                const i = data.length < index ? data.length : index;
                data[i] = exports.patch(val, data[index]);
            }
        }
        return data;
    }
    else {
        if (data === null
            || data === undefined
            || data.constructor === Boolean
            || data.constructor === EphemeralBoolean
            || data.constructor === String
            || data.constructor === Number
            || data.constructor === Array) {
            throw Error('data is not Object');
        }
        for (const [key, value] of Object.entries(plan)) {
            if (data[key] === undefined) {
                data[key] = value;
            }
            else {
                data[key] = exports.patch(value, data[key]);
            }
        }
        return data;
    }
};
exports.initProc = (init$, patch$, rawSink, dataSink, compute) => init$.pipe(operators_1.switchMap((initial) => patch$.pipe(operators_1.scan((acc, curr) => exports.patch(curr, JSON.parse(JSON.stringify(acc))), initial), operators_1.mergeMap((raw) => rxjs_1.of(rawSink(JSON.parse(JSON.stringify(raw))), dataSink(compute(raw)))), operators_1.startWith(rawSink(initial), dataSink(compute(initial))))));
exports.splice = (start, deleteCount = 0, items = []) => Array(start).concat(Array(deleteCount).fill(undefined)).concat(...items);
exports.padArray = (start, item, end = 0) => Array(start).concat(item, Array(end));
//# sourceMappingURL=processors.js.map