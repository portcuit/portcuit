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
exports.snabbdomActionPatchKit = exports.snabbdomKit = exports.SnabbdomPort = exports.defaultModules = void 0;
const init_1 = require("snabbdom/init");
const class_1 = require("snabbdom/modules/class");
const props_1 = require("snabbdom/modules/props");
const attributes_1 = require("snabbdom/modules/attributes");
const style_1 = require("snabbdom/modules/style");
const eventlisteners_1 = require("snabbdom/modules/eventlisteners");
const dataset_1 = require("snabbdom/modules/dataset");
const tovnode_1 = require("snabbdom/tovnode");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const pkit_1 = require("pkit");
const selector_1 = require("./modules/selector");
const trigger_1 = require("./modules/trigger");
const jsx_1 = require("./modules/jsx");
const action_1 = require("./modules/action");
const _1 = require("./");
__exportStar(require("./modules/action"), exports);
__exportStar(require("./processors"), exports);
exports.defaultModules = [
    selector_1.selectorModule,
    class_1.classModule,
    props_1.propsModule,
    attributes_1.attributesModule,
    style_1.styleModule,
    eventlisteners_1.eventListenersModule,
    dataset_1.datasetModule,
    trigger_1.triggerModule,
    jsx_1.jsxModule
];
class SnabbdomPort extends pkit_1.LifecyclePort {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "render", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new pkit_1.Socket()
        });
        Object.defineProperty(this, "vnode", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new pkit_1.Socket()
        });
        Object.defineProperty(this, "action", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new pkit_1.Socket()
        });
        Object.defineProperty(this, "event", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new class {
                constructor() {
                    Object.defineProperty(this, "hashchange", {
                        enumerable: true,
                        configurable: true,
                        writable: true,
                        value: new pkit_1.Socket()
                    });
                }
            }
        });
    }
}
exports.SnabbdomPort = SnabbdomPort;
exports.snabbdomKit = (port) => rxjs_1.merge(pkit_1.source(port.init).pipe(operators_1.switchMap(({ container, target }) => {
    const patch = init_1.init([action_1.createActionModule(target), ...exports.defaultModules]);
    return pkit_1.directProc(pkit_1.source(port.render).pipe(operators_1.scan((acc, vnode) => patch(acc, vnode), tovnode_1.toVNode(container))), pkit_1.sink(port.vnode));
})), pkit_1.latestMapProc(pkit_1.source(port.terminate), pkit_1.sink(port.info), [pkit_1.source(port.init), pkit_1.source(port.vnode)], ([, { container }, vnode]) => vnode.elm.parentNode.replaceChild(container, vnode.elm)), pkit_1.mergeMapProc(pkit_1.source(port.init), pkit_1.sink(port.action), ({ target }) => rxjs_1.fromEvent(target, 'action').pipe(operators_1.map(({ detail }) => detail))), optionsKit(port));
exports.snabbdomActionPatchKit = (port, state) => _1.actionProc(pkit_1.source(port.action), pkit_1.sink(state.patch));
const optionsKit = (port) => pkit_1.source(port.init).pipe(operators_1.filter(({ options }) => !!options), operators_1.map(({ options }) => options), operators_1.switchMap(({ window, hashchange }) => rxjs_1.merge(...(hashchange ? [
    pkit_1.directProc(rxjs_1.fromEvent(window, 'hashchange').pipe(operators_1.map(() => window.location.hash)), pkit_1.sink(port.event.hashchange))
] : []))));
//# sourceMappingURL=index.js.map